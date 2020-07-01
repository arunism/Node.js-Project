const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async(req, res, next) => {
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  res.status(200).render('tour', {
    title: `${tour.name}`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
}

exports.getProfile = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Profile'
  });
}

exports.updateUserProfile = catchAsync(async(req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  },
  {
    new: true,
    runValidators: true
  },);
  res.status(200).render('account', {
    title: 'Your Profile',
    user: updatedUser
  });
});
