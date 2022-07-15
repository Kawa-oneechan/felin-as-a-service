const createError = require('http-errors');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const logger = require('morgan');
const fs = require('fs');

var genRouter = require('./generator');
var dictRouter = require('./dictionary');
var numRouter = require('./numbers');

var app = express();

app.use(helmet());

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
//app.set('view options', { rmWhitespace: true});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ 'extended': false }));

app.use(function(req, res, next) {
	res.removeHeader('Content-Security-Policy');
	next();
});

//app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/', genRouter);
app.use('/', dictRouter);
app.use('/', numRouter);

//catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
	next(createError(404));
});
*/

// error handler
/*
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});
*/

module.exports = app;
