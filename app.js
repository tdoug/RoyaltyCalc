"use strict";

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');
var auth = require('http-auth');

var basic = auth.basic({
  realm: "Basic User",
  file: __dirname + "/users.htpasswd"
});

//var index = require('./routes/index');
var files = require('./routes/files');
var tools = require('./routes/tools');
var authors = require('./routes/authors');
var settings = require('./routes/settings');
var admin = require('./routes/admin');

var api = require('./routes/api');
var processing = require('./routes/processing');
var reports = require('./routes/reports');

var app = express();
app.use(auth.connect(basic));

///uploads
app.use(express.static(__dirname + '/..'));
app.timeout = 60000;

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authors);
app.use('/files', files);
app.use('/tools', tools);
app.use('/authors', authors);
app.use('/reports', reports);
app.use('/settings', settings);
app.use('/admin', admin);

app.use('/api', api);
app.use('/processing', processing);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.log(err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});


module.exports = app;