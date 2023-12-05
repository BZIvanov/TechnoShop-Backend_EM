const status = require('http-status');
const { v4: uuidv4 } = require('uuid');

const cloudinary = require('../../providers/cloudinary');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');

module.exports.uploadImage = catchAsync(async (req, res) => {
  const image = await cloudinary.uploader.upload(req.body.image, {
    public_id: uuidv4(),
    resource_type: 'auto', // jpeg, png
  });

  res.status(status.OK).json({
    success: true,
    publicId: image.public_id,
    imageUrl: image.secure_url,
  });
});

module.exports.removeImage = catchAsync(async (req, res, next) => {
  const { result } = await cloudinary.uploader.destroy(req.body.publicId);

  if (result !== 'ok') {
    return next(new AppError('Remove image error', status.BAD_REQUEST));
  }

  res.status(status.NO_CONTENT).json();
});
