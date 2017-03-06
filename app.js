//try https://github.com/vote539/socketio-file-upload for upload and progress bar
//syntax highlighting for console  http://jsfiddle.net/KJQ9K/554/
//add delteing when deleteing buckets
//clear metainpt form after upload
//display more than one metadata
//fix object not being selected on creation

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var multer = require('multer');
var fs = require('fs');
var AWS = require('aws-sdk');

AWS.config.loadFromPath('../config.json');

var s3 = new AWS.S3();

var routes = require('./routes.js')(app, io, multer, fs, s3);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});
    
app.use(express.static(__dirname + '/'));

server.listen(80, function () {
  console.log('Listening on port 80');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});