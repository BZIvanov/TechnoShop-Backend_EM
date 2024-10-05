const crypto = require('crypto');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');

const sendEmail = require('../../providers/mailer');
const User = require('./user.model');
const AppError = require('../../utils/app-error');
const catchAsync = require('../../middlewares/catch-async');
const { signJwtToken } = require('./utils/jwtToken');
const { setJwtCookie, clearJwtCookie } = require('./utils/jwtCookie');
const { cookieName } = require('./user.constants');
const { ENV_VARS } = require('../../config/environment');

module.exports.register = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;

  const user = await User.create({ username, email, password });

  const token = signJwtToken(user._id);
  setJwtCookie(res, token);

  res.status(httpStatus.CREATED).json({
    success: true,
    user: { _id: user._id, username: user.username, role: user.role },
  });
});

module.exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError('Please provide email and password', httpStatus.BAD_REQUEST),
    );
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid credentials', httpStatus.UNAUTHORIZED));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', httpStatus.UNAUTHORIZED));
  }

  const token = signJwtToken(user._id);
  setJwtCookie(res, token);

  res.status(httpStatus.OK).json({
    success: true,
    user: { _id: user._id, username: user.username, role: user.role },
  });
});

module.exports.logout = catchAsync(async (req, res) => {
  clearJwtCookie(res);

  res.status(httpStatus.OK).json({ success: true });
});

// do not use the authenticate middleware, because in case of no user, we want to return success response with no user
module.exports.currentUser = catchAsync(async (req, res) => {
  const token = req.cookies[cookieName];

  if (!token) {
    return res.status(httpStatus.OK).json({ success: true, user: null });
  }

  const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(httpStatus.OK).json({ success: true, user: null });
  }

  res.status(httpStatus.OK).json({
    success: true,
    user: { _id: user._id, username: user.username, role: user.role },
  });
});

module.exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  const { oldPassword, newPassword } = req.body;

  if (!(await user.comparePassword(oldPassword))) {
    return next(new AppError('Incorrect password', httpStatus.BAD_REQUEST));
  }

  user.password = newPassword;
  await user.save();
  res.status(httpStatus.OK).json({ success: true });
});

module.exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(httpStatus.OK).json({
      success: true,
      message:
        'You will soon receive an email, if the provided email was valid.',
    });
  }

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${ENV_VARS.FRONTEND_URL}/reset-password/${resetToken}`;
  const text = `Here is your password reset URL:\n\n${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      text,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('Email was not sent!', httpStatus.INTERNAL_SERVER_ERROR),
    );
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: 'You will soon receive an email, if the provided email was valid.',
  });
});

module.exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid token', httpStatus.BAD_REQUEST));
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Your password was successfully reset. Try to login now',
  });
});
