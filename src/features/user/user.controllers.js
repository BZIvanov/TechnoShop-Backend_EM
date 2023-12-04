const status = require('http-status');

const User = require('./user.model');
const catchAsync = require('../../middlewares/catch-async');
const { signJwtToken } = require('./utils/jwtToken');
const { setJwtCookie, clearJwtCookie } = require('./utils/jwtCookie');

module.exports.register = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;

  const user = await User.create({ username, email, password });

  const token = signJwtToken(user._id);
  setJwtCookie(res, token);

  res.status(status.CREATED).json({
    success: true,
    user: { _id: user._id, username: user.username, role: user.role },
  });
});

module.exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError('Please provide email and password', status.BAD_REQUEST)
    );
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid credentials', status.UNAUTHORIZED));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', status.UNAUTHORIZED));
  }

  const token = signJwtToken(user._id);
  setJwtCookie(res, token);

  res.status(status.OK).json({
    success: true,
    user: { _id: user._id, username: user.username, role: user.role },
  });
});

module.exports.logout = catchAsync(async (req, res, next) => {
  clearJwtCookie(res);

  res.status(status.OK).json({ success: true });
});
