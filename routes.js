exports = module.exports = function(app, io, multer, fs, s3) {

  app.post('/uploadObject', multer({dest:'tmp/'}).single('fileChooser'), function(req, res) {
    console.log('upload object request');
    var bucketName = req.query.bucket;
    var keyName = req.file.originalname;
    var file = req.file;
    var metadata = {};
    metadata[req.body.metadataKey1] = req.body.metadataValue1;
    metadata[req.body.metadataKey2] = req.body.metadataValue2;
    
    //Create a file stream
    var stream = fs.createReadStream(file.path); 

    var params = {
      Bucket: bucketName,
      Key: keyName
    };
    io.emit('console', {
      message: "s3.getSignedUrl()"
    });
    var url = s3.getSignedUrl('putObject', params, function (err, url) {
      if (err) {
        console.log(err, err.stack);
      } else {
        io.emit('console', {
          message: "s3.putObject()"
        });
        var params = {
          Bucket: bucketName,
          Key: keyName,
          // ContentType: file.type,
          Body: stream,
          ACL: 'public-read',
          Metadata: metadata,
          // SSECustomerAlgorithm: 'STRING_VALUE',
          // SSECustomerKey: new Buffer('...') || 'STRING_VALUE',
          // SSECustomerKeyMD5: 'STRING_VALUE',
          // SSEKMSKeyId: 'STRING_VALUE',
          // ServerSideEncryption: 'AES256 | aws:kms',
          // StorageClass: 'STANDARD | REDUCED_REDUNDANCY | STANDARD_IA',
          // WebsiteRedirectLocation: 'STRING_VALUE',
        };
        s3.putObject(params, function (err, data) {
          console.log("putting object");
          if (err) {
            // console.log(err);
            io.emit('console', {
              message: err
            });
          } else {
            // console.log(data);
            // res.send(data);
            io.emit('console', {
              message: data
            });
            io.emit('uploadComplete', {
              object: keyName,
            });
            fs.unlink(file.path, function (err) {
              if (err) {
                console.error(err);
              }
            });
          }
        });
      }
    });
  });

  io.on('connection', function (socket) {

    socket.on('listBuckets', function () {
      listBuckets();
    });

    socket.on('deleteBucket', function(data) {
      console.log("client requested to delete bucket");
      consoleEmit('s3.deleteBucket('+data.bucket+')');
      s3.deleteBucket({
        Bucket: data.bucket
      }, function(err, data) {
        if (err) {
          consoleEmit(err);
        } else {
          consoleEmit(data)
          listBuckets();
        }
      });
    });

    socket.on('createBucket', function(data) {
      var bucket = data.bucket;
      var params = {
        Bucket: bucket
      };
      s3.createBucket(params, function(err, data) {
        consoleEmit("s3.createBucket({Bucket: "+bucket+"})");
        if (err) {
          consoleEmit(err)
        } else {
          consoleEmit(data);
          var params = {
            Bucket: bucket,
            CORSConfiguration: {
              CORSRules: [
                {
                  AllowedMethods: [ /* required */
                    'PUT',
                    'POST',
                    'GET',
                    /* more items */
                  ],
                  AllowedOrigins: [ /* required */
                    '*',
                    /* more items */
                  ],
                  AllowedHeaders: [
                    '*',
                    /* more items */
                  ],
                },
              ]
            },
          };
          s3.putBucketCors(params, function(err, data) {
            if (err) {
              consoleEmit(err);
            } else {
              consoleEmit(data);
            }
          });
          socket.emit('createBucketComplete', {
            bucket: bucket
          });
          listBuckets();
          listObjects(bucket);
        }
      });
    });

    socket.on('emptyBucket', function (data) {
      var bucket = data.bucket;
      var params = {
        Bucket: bucket
      };
      console.log("client requested to empty bucket");
      socket.emit('console', { 
        message: 's3.listObjectsV2({Bucket: '+data.bucket+'})'
      });
      s3.listObjectsV2(params, function(err, data) {
        if (err) {
          socket.emit('console', { 
            message: err
          });
        } else if (data.Contents.length == 0) {
          socket.emit('console', { 
            message: "Bucket is already empty"
          });
        } else {
          params = {Bucket: bucket};
          params.Delete = {Objects:[]};

          data.Contents.forEach(function(content) {
            params.Delete.Objects.push({Key: content.Key});
          });

          s3.deleteObjects(params, function(err, data) {
            if (err) {
              socket.emit('console', { 
                message: err
              });
            // } else if (data.Contents.length == 1000) {
            //   emptyBucket(req.params.bucket,callback);
            } else {
              socket.emit('console', { 
                message: data
              });
              listObjects(bucket);
            }
          });
        }
      });
    });

    socket.on('listObjects', function(data) {
      listObjects(data.bucket);
    });

    socket.on('deleteObject', function(data) {
      var params = { 
        Bucket: data.bucket,
        Key: data.object,
      }
      consoleEmit("s3.deleteObject({Bucket: "+data.bucket+", Key: "+data.object+"})");
      s3.deleteObject(params, function (err, data) {
        if (err) {
          consoleEmit(err);
        } else {
          consoleEmit(data);
          listObjects(params.Bucket);
        }
      });
    });

    socket.on('getMetadata', function(data) {
      consoleEmit("s3.headObject({Bucket: "+data.bucket+", Key: "+data.object+"})");
      var params = { 
        Bucket: data.bucket,
        Key: data.object,
      }
      s3.headObject(params, function(err, data) {
        if (err) {
          consoleEmit(err);
        } else {
          consoleEmit(data);
          socket.emit('renderMetadata', { 
            metadata: data.Metadata
          });
        }
      })
    });
  
    function consoleEmit(message) {
      socket.emit('console', {
        message: message
      });
    }

    function listBuckets() {
      consoleEmit('s3.listBuckets()');
      s3.listBuckets(function(err, data) {
        if (err) {
          consoleEmit(err);
        } else {
          app.locals = {
            currentBucketList : data.Buckets
          };
          consoleEmit(data);
          socket.emit('buckets', {
            buckets: data.Buckets
          });
        }
      });
    }

    function listObjects(bucket) {
      console.log("client requested to list objects");
      // var bucket = data.bucket;
      var params = {
        Bucket: bucket,
      }
      consoleEmit("s3.listObjectsV2({Bucket: "+bucket+"})");
      s3.listObjectsV2(params, function(err, data) {
        if (err) {
          consoleEmit(err);
        }
        else {
          // res.render('index', {
          //   bucketList: app.locals.currentBucketList,
          //   currentBucket: data.Name,
          //   objectList: data.Contents,
          //   objectBucket: bucket
          // });
          consoleEmit(data);
          socket.emit('renderObjects', {
            objects: data,
          })
        }
      });
    }



  }); //end of io.on('connection')


}

