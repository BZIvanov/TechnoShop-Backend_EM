const express = require('express');

const userRoutes = require('../../features/user/user.routes');
const categoryRoutes = require('../../features/category/category.routes');
const subcategoryRoutes = require('../../features/subcategory/subcategory.routes');
const productRoutes = require('../../features/product/product.routes');
const imageRoutes = require('../../features/image/image.routes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/products', productRoutes);
router.use('/images', imageRoutes);

module.exports = router;
