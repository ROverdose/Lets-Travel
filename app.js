require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');

var indexRouter = require('./routes/index');

//For sessions
const session = require('express-session');
const MongoStore = require('connect-mongo');

//For Flash Messages
const flash = require('connect-flash');

// For passport.js:
const User = require('./models/user');
const passport = require('passport');

var app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", "https://res.cloudinary.com/"]
    }
  }
}));

//compress responses
app.use(compression());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: false,
  store: MongoStore.create({ mongoUrl: process.env.DB })
}));

// Configure passport middleware
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Flash messages
app.use(flash());

app.use( (req, res, next) => {
  res.locals.user = req.user;
  res.locals.url = req.path;
  res.locals.flash = req.flash();
  next();
});

// set up mongoose connection
mongoose.connect(process.env.DB);
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (error) => console.error(error.message));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
