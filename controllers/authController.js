const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const {promisify} = require('util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const signToken = id => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_EXPIRES});
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES*24*60*60*1000),
    httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {user}
  });
}

exports.signup = catchAsync(async(req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async(req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return next(new AppError('Please provide both email and password.', 400));
  };
  const user = await User.findOne({email}).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async(req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  };
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  };

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The user belonging to this token does not exists.', 401));
  }

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    };
    next();
  };
};

exports.isAuthenticated = async(req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {return next();}
      if (freshUser.changedPasswordAfter(decoded.iat)) {return next();}
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  };
  next();
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
  const user = await User.findOne({email:req.body.email});
  if (!user) {
    return next(new AppError('There is no user with this email address.', 404));
  };

  const resetToken = user.createPasswordResetToken();
  await user.save({validateBeforeSave:false});

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit your PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forgot your password then ignore this email.`;
  try {
    await sendEmail ({
      email: user.email,
      subject: 'Your password reset token is valid only for 10 minutes.',
      message
    });
    res.status(200).json({
      status: 'success',
      message: 'Token has been sent to your email!'
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({validateBeforeSave:false});
    return next(new AppError('There was an error sending email. Try again later!', 500));
  }
});

exports.resetPassword = catchAsync(async(req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('Hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {$gt: Date.now()}
  });

  if (!user) {
    return next(new AppError('Token is either invlid or has expired.', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async(req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
