const cloudinary = require('cloudinary').v2;

const { ENV_VARS } = require('../config/environment');

cloudinary.config({
  cloud_name: ENV_VARS.CLOUDINARY_CLOUD_NAME,
  api_key: ENV_VARS.CLOUDINARY_API_KEY,
  api_secret: ENV_VARS.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
