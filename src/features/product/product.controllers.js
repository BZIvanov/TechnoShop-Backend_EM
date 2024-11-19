const httpStatus = require('http-status');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

const Product = require('./product.model');
const Shop = require('../shop/shop.model');
const catchAsync = require('../../middlewares/catch-async');
const AppError = require('../../utils/app-error');
const Subcategory = require('../subcategory/subcategory.model');
const cloudinary = require('../../providers/cloudinary');
const {
  shopActivityStatuses,
  shopPaymentStatuses,
} = require('../shop/shop.constants');

const handleQueryParams = async (params) => {
  const {
    text,
    price,
    categories,
    subcategories,
    rating,
    shipping,
    brands,
    category,
    subcategory,
  } = params;

  const build = {
    ...(text && { $text: { $search: text } }), // this will work on fields with text property in the model
    ...(price && {
      price: {
        $gte: parseInt(price.split(',')[0], 10),
        $lte: parseInt(price.split(',')[1], 10),
      },
    }),
    ...(categories && { category: { $in: categories.split(',') } }),
    ...(subcategories && {
      subcategories: { $in: subcategories.split(',') },
    }),
    ...(rating && { averageRating: rating }),
    ...(shipping && { shipping }),
    ...(brands && { brand: { $in: brands.split(',') } }),
    ...(category && { category }), // category from params will override categories from query
    ...(subcategory && { subcategories: subcategory }),
  };

  return build;
};

const getProducts = catchAsync(async (req, res) => {
  const { categoryId, subcategoryId } = req.params;

  let subcategory;
  if (subcategoryId) {
    subcategory = await Subcategory.findById(subcategoryId).exec();
  }

  const {
    sortColumn = 'createdAt',
    order = 'desc',
    page,
    perPage,
    ...rest
  } = req.query;

  const builder = await handleQueryParams({
    category: categoryId,
    subcategory,
    ...rest,
  });

  const pageNumber = parseInt(page, 10) || 1;
  const perPageNumber = parseInt(perPage, 10) || 12;

  const products = await Product.find(builder)
    .skip((pageNumber - 1) * perPageNumber)
    .limit(perPageNumber)
    .populate('category')
    .populate('subcategories')
    .sort([[sortColumn, order]]);

  const totalCount = await Product.where(builder).countDocuments();

  res.status(httpStatus.OK).json({ success: true, products, totalCount });
});

const getProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .populate('shop', '_id shopInfo activityStatus paymentStatus')
    .populate('category')
    .populate('subcategories');

  if (!product) {
    return next(new AppError('Product not found', httpStatus.NOT_FOUND));
  }

  res.status(httpStatus.OK).json({ success: true, product });
});

const uploadFilesToCloudinary = async (files) => {
  const uploadPromises = files.map(
    (file) =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: uuidv4(),
            resource_type: 'auto',
            folder: 'categories',
          },
          (uploadError, uploadResult) => {
            if (uploadError) {
              reject(uploadError);
            } else {
              resolve(uploadResult);
            }
          },
        );

        uploadStream.end(file.buffer);
      }),
  );

  const uploadResults = await Promise.all(uploadPromises);
  return uploadResults.map((uploadResult) => ({
    publicId: uploadResult.public_id,
    imageUrl: uploadResult.secure_url,
  }));
};

const createProduct = catchAsync(async (req, res, next) => {
  const productData = { ...req.body };

  const shop = await Shop.findOne({ user: req.user._id });

  if (!shop) {
    return next(new AppError('Shop not found', httpStatus.NOT_FOUND));
  }

  if (
    shop.activityStatus !== shopActivityStatuses.active ||
    shop.paymentStatus !== shopPaymentStatuses.paid
  ) {
    return next(
      new AppError(
        'This shop cannot currently have products',
        httpStatus.BAD_REQUEST,
      ),
    );
  }

  const uploadResults = await uploadFilesToCloudinary(req.files || []);

  productData.slug = slugify(req.body.title);
  productData.shop = shop._id;
  productData.images = uploadResults;

  const product = await Product.create(productData);

  res.status(httpStatus.CREATED).json({ success: true, product });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const productData = { ...req.body };
  const newImageFiles = req.files;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError('Product not found', httpStatus.NOT_FOUND));
  }

  product.images
    .filter((productImage) => {
      const imagesToKeep = productData.existingImages || [];
      return !imagesToKeep.includes(productImage.publicId);
    })
    .map((productImage) => productImage.publicId)
    .forEach(async (uploadedImageToRemove) => {
      await cloudinary.uploader.destroy(uploadedImageToRemove);
    });

  const uploadedImagesToKeep = product.images.filter((productImage) => {
    const imagesToKeep = productData.existingImages || [];
    return imagesToKeep.includes(productImage.publicId);
  });

  const uploadResults = await uploadFilesToCloudinary(newImageFiles || []);

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { ...productData, images: [...uploadedImagesToKeep, ...uploadResults] },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(httpStatus.OK).json({ success: true, product: updatedProduct });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    return next(new AppError('Product not found', httpStatus.NOT_FOUND));
  }

  product.images.forEach(async (image) => {
    await cloudinary.uploader.destroy(image.publicId);
  });

  res.status(httpStatus.NO_CONTENT).json();
});

const getSimilarProducts = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { perPage } = req.query;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError('Product not found', httpStatus.NOT_FOUND));
  }

  const perPageNumber = parseInt(perPage, 10) || 3;

  const builder = {
    _id: { $ne: product._id },
    category: product.category,
  };

  const similarProducts = await Product.find(builder)
    .limit(perPageNumber)
    .populate('category')
    .populate('subcategories');

  const totalCount = await Product.where(builder).countDocuments();

  res.status(httpStatus.OK).json({
    success: true,
    products: similarProducts,
    totalCount,
  });
});

const getProductBrands = catchAsync(async (req, res) => {
  const productBrands = await Product.distinct('brand');

  res.status(httpStatus.OK).json({
    success: true,
    brands: productBrands,
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSimilarProducts,
  getProductBrands,
};
