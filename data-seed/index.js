require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../src/features/user/user.model');
const Category = require('../src/features/category/category.model');
const Subcategory = require('../src/features/subcategory/subcategory.model');
const users = require('./users.json');
const categories = require('./categories.json');
const subcategories = require('./subcategories.json');

mongoose.connect(process.env.DATABASE_URI, {});

const seedData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Subcategory.deleteMany();

    await User.create(users);
    await Category.create(categories);
    await Subcategory.create(subcategories);

    console.log('Data seeded');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

seedData();
