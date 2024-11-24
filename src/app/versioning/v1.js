const express = require('express');

const userRoutes = require('../../features/user/user.routes');
const shopsRoutes = require('../../features/shop/shop.routes');
const categoryRoutes = require('../../features/category/category.routes');
const subcategoryRoutes = require('../../features/subcategory/subcategory.routes');
const productRoutes = require('../../features/product/product.routes');
const reviewRoutes = require('../../features/review/review.routes');
const couponRoutes = require('../../features/coupon/coupon.routes');
const orderRoutes = require('../../features/order/order.routes');
const wishlistRoutes = require('../../features/wishlist/wishlist.routes');
const chatRoutes = require('../../features/chat/chat.routes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/shops', shopsRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);
router.use('/wishlists', wishlistRoutes);
router.use('/chats', chatRoutes);

module.exports = router;
