const crypto = require('crypto');
const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const {
  model: { User },
  userTypes,
} = require('./user.constants');

const schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a name'],
      maxLength: [50, 'User name should be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minLength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    address: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(userTypes),
      default: userTypes.user,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

schema.pre('save', async function hashUserPassword(next) {
  if (!this.isModified('password')) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 8);
  next();
});

schema.methods.comparePassword = async function comparePasswords(
  incomingPassword
) {
  return bcrypt.compare(incomingPassword, this.password);
};

schema.methods.getResetPasswordToken = function generateResetPasswordToken() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = model(User, schema);
