const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routers/tourRouter');
const userRouter = require('./routers/userRouter');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const reviewRouter = require('./routers/reviewRouter');
const path = require('path');
const viewRouter = require('./routers/viewRouter');
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());

app.use(express.json());
// app.use(express.urlencoded({extended:true, limit:'10kb'}));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());

app.use(hpp({
  whitelist: ['duration', 'maxGroupSize', 'difficulty', 'ratingsAverage', 'ratingsQuantity', 'price']
}));

if (process.env.NODE_ENV === "development"){
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Too many requests from this IP, please try again in an hour.'
});

app.use('/api', limiter);

// app.use((req, res, next) => {
//   console.log("Hello from the middleware!");
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on the server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
