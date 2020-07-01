const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

dotenv.config({path: './config.env'});

mongoose.connect(process.env.DATABASE, {
  userNewUrlParser: true,
  userCreateIndex: true,
  userFindAndModify: false,
}).then(() => console.log("Database connected successfully!"));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, {validateBeforeSave:false});
    await Review.create(reviews);
    console.log("Data successfully loaded to database!");
  } catch (e) {
    console.log(e);
  }
  process.exit();
}

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data successfully deleted from database!");
  } catch (e) {
    console.log(e);
  }
  process.exit();
}

// console.log(process.argv);

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
