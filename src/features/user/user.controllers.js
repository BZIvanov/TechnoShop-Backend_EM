const crypto = require('crypto');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const cloudinary = require('../../providers/cloudinary');
const sendEmail = require('../../providers/mailer');
const User = require('./user.model');
const Shop = require('../shop/shop.model');
const Chat = require('../chat/chat.model');
const AppError = require('../../utils/app-error');
const catchAsync = require('../../middlewares/catch-async');
const { signJwtToken } = require('./utils/jwtToken');
const { setJwtCookie, clearJwtCookie } = require('./utils/jwtCookie');
const { cookieName, userRoles } = require('./user.constants');
const { chatTypes } = require('../chat/chat.constants');
const { ENV_VARS } = require('../../config/environment');

const register = catchAsync(async (req, res, next) => {
  const { username, email, password, role, registerMethod } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists', httpStatus.BAD_REQUEST));
  }

  const newUser = await User.create({
    username,
    email,
    password,
    role: role === userRoles.seller ? userRoles.seller : userRoles.buyer,
    registerMethod,
  });

  // create a Shop and Chat with admin for newly registered sellers
  if (role === userRoles.seller) {
    await Shop.create({ user: newUser._id });

    const adminUser = await User.findOne({ role: userRoles.admin });
    const chat = new Chat({
      participants: [
        { user: adminUser._id, role: userRoles.admin },
        { user: newUser._id, role: userRoles.seller },
      ],
      chatType: chatTypes.sellerAdmin,
      messages: [],
    });
    await chat.save();
  }

  const token = signJwtToken(newUser._id);
  setJwtCookie(res, token);

  res.status(httpStatus.CREATED).json({
    success: true,
    user: {
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role,
      avatar: newUser.avatar,
    },
  });
});

const login = catchAsync(async (req, res, next) => {
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
    user: {
      _id: user._id,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  clearJwtCookie(res);

  res.status(httpStatus.OK).json({ success: true });
});

// do not use the authenticate middleware, because in case of no user, we want to return success response with no user
const currentUser = catchAsync(async (req, res) => {
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
    user: {
      _id: user._id,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  const { oldPassword, newPassword } = req.body;

  if (!(await user.comparePassword(oldPassword))) {
    return next(new AppError('Incorrect password', httpStatus.BAD_REQUEST));
  }

  user.password = newPassword;
  await user.save();
  res.status(httpStatus.OK).json({ success: true });
});

const forgotPassword = catchAsync(async (req, res, next) => {
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

const resetPassword = catchAsync(async (req, res, next) => {
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

const updateAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(
      new AppError('Avatar image was not provided', httpStatus.BAD_REQUEST),
    );
  }

  if (req.user.avatar.publicId) {
    const { result: removeResult } = await cloudinary.uploader.destroy(
      req.user.avatar.publicId,
    );

    if (removeResult !== 'ok' && removeResult !== 'not found') {
      return next(
        new AppError(
          'Remove avatar image error',
          httpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    }
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: uuidv4(),
        resource_type: 'auto',
        folder: 'avatars',
      },
      (uploadError, uploadCb) => {
        if (uploadError) {
          reject(uploadError);
        } else {
          resolve(uploadCb);
        }
      },
    );

    uploadStream.end(req.file.buffer);
  });

  await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: {
        publicId: uploadResult.public_id,
        imageUrl: uploadResult.secure_url,
      },
    },
    { runValidators: true },
  );

  res.status(httpStatus.OK).json({ success: true, message: 'Avatar updated' });
});

module.exports = {
  register,
  login,
  logout,
  currentUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  updateAvatar,
};
