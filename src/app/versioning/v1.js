const express = require('express');

const userRoutes = require('../../features/user/user.routes');
const categoryRoutes = require('../../features/category/category.routes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
