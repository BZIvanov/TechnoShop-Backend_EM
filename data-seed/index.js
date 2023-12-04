require('dotenv').config();
const mongoose = require('mongoose');

const Category = require('../src/features/category/category.model');
const categories = require('./categories.json');

mongoose.connect(process.env.DATABASE_URI, {});

const seedData = async () => {
  try {
    await Category.deleteMany();

    await Category.create(categories);

    console.log('Data seeded');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

seedData();
