const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config({path: './config.env'})

process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTIONS! Shutting down...');
});

// console.log(uncaughtExceptionCheck);

const app = require('./app');

mongoose.connect(process.env.DATABASE, {
  userNewUrlParser: true,
  userCreateIndex: true,
  userFindAndModify: false,
}).then(() => console.log("Database connected successfully!"));

// console.log(process.env);

const port = 8000 || process.env.PORT;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
