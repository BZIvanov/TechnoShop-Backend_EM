const mongoose = require('mongoose');

const { environment } = require('../src/config/environment');
const User = require('../src/features/user/user.model');
const Category = require('../src/features/category/category.model');
const Subcategory = require('../src/features/subcategory/subcategory.model');
const Product = require('../src/features/product/product.model');
const Coupon = require('../src/features/coupon/coupon.model');
const Wishlist = require('../src/features/wishlist/wishlist.model');
const Order = require('../src/features/order/order.model');
const users = require('./users.json');
const categories = require('./categories.json');
const subcategories = require('./subcategories.json');
const products = require('./products.json');
const coupons = require('./coupons.json');
const wishlists = require('./wishlists.json');
const orders = require('./orders.json');

mongoose.connect(environment.DATABASE_URI, {});

const seedData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Subcategory.deleteMany();
    await Product.deleteMany();
    await Coupon.deleteMany();
    await Wishlist.deleteMany();
    await Order.deleteMany();

    await User.create(users);
    await Category.create(categories);
    await Subcategory.create(subcategories);
    await Product.create(products);
    await Coupon.create(coupons);
    await Wishlist.create(wishlists);
    await Order.create(orders);

    console.log('Data seeded');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

seedData();
