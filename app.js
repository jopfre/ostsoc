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