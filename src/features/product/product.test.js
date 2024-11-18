const request = require('supertest');

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const getApp = require('../../app/express');
const User = require('../user/user.model');
const Shop = require('../shop/shop.model');
const Category = require('../category/category.model');
const Subcategory = require('../subcategory/subcategory.model');
const Product = require('./product.model');
const { signJwtToken } = require('../user/utils/jwtToken');
const users = require('../../../data-seed/users.json');
const shops = require('../../../data-seed/shops.json');
const categories = require('../../../data-seed/categories.json');
const subcategories = require('../../../data-seed/subcategories.json');
const products = require('../../../data-seed/products.json');

const app = getApp();

describe('Product routes', () => {
  beforeAll(async () => {
    await mongoDbConnect();

    await User.create(users);
    await Shop.create(shops);
    await Category.create(categories);
    await Subcategory.create(subcategories);
    await Product.create(products);
  });

  afterAll(async () => {
    await mongoDbDisconnect();
  });

  describe('Get products controller', () => {
    test('it should get products successfully', async () => {
      const response = await request(app)
        .get('/v1/products')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalCount', 20);
      expect(response.body.products[0]).toHaveProperty('title');
    });

    test('it should get two products if perPage is 2', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ perPage: 2 })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 20);
      expect(response.body.products.length).toBe(2);
    });

    test('it should get empty list for too big page number', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ page: 100, perPage: 100 })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 20);
      expect(response.body.products.length).toBe(0);
    });

    test('it should get product within price range', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ price: '18,19' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 1);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].price).toBe(18.88);
    });

    test('it should get products with rating value', async () => {
      const INCOMING_RATING = 4;
      const response = await request(app)
        .get('/v1/products')
        .query({ rating: INCOMING_RATING })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 4);
      expect(response.body.products.length).toBe(4);

      response.body.products.forEach((product) => {
        const productRatings = product.ratings.map((rating) => rating.stars);
        const ratingsSum = productRatings.reduce((acc, curr) => acc + curr, 0);
        const averagetRating = Math.ceil(ratingsSum / productRatings.length);
        expect(averagetRating).toBe(INCOMING_RATING);
      });
    });

    test('it should get products with selected subcategory', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ subcategories: subcategories[10]._id })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 1);
      expect(response.body.products.length).toBe(1);

      response.body.products.forEach((product) => {
        const productSubcategoriesNames = product.subcategories.map(
          (subcategory) => subcategory.name,
        );
        const correctCategoryName = productSubcategoriesNames.find(
          (subcategoryName) => subcategoryName === subcategories[10].name,
        );
        expect(correctCategoryName).toBeDefined();
      });
    });

    test('it should get products with multiple selected subcategories', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({
          subcategories: `${subcategories[10]._id},${subcategories[14]._id}`,
        })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 3);
      expect(response.body.products.length).toBe(3);

      response.body.products.forEach((product) => {
        const productSubcategoriesNames = product.subcategories.map(
          (subcategory) => subcategory.name,
        );
        const correctCategoryName = productSubcategoriesNames.find(
          (subcategoryName) =>
            subcategoryName === subcategories[10].name ||
            subcategoryName === subcategories[14].name,
        );
        expect(correctCategoryName).toBeDefined();
      });
    });

    test('it should get products with shipping option Yes selected', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ shipping: 'Yes' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 14);
      expect(response.body.products.length).toBe(12);

      const productsShippingOption = response.body.products
        .map((product) => product.shipping)
        .filter((shipping) => shipping !== 'Yes');
      expect(productsShippingOption.length).toBe(0);
    });

    test('it should get products with shipping option No selected', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ shipping: 'No' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('totalCount', 6);
      expect(response.body.products.length).toBe(6);

      const productsShippingOption = response.body.products
        .map((product) => product.shipping)
        .filter((shipping) => shipping !== 'No');
      expect(productsShippingOption.length).toBe(0);
    });

    test('it should get products for specific category', async () => {
      const response = await request(app).get(
        `/v1/categories/${products[2].category}/products`,
      );

      expect(response.body).toHaveProperty('totalCount', 3);
      const productsCategoriesIds = response.body.products.map(
        (product) => product.category._id,
      );
      const uniqueCategoriesIds = new Set(productsCategoriesIds);
      expect(uniqueCategoriesIds.size).toBe(1);
    });

    test('it should get products for specific subcategory', async () => {
      const subcategoryId = products[3].subcategories[1];
      const response = await request(app).get(
        `/v1/subcategories/${subcategoryId}/products`,
      );

      expect(response.body).toHaveProperty('totalCount', 2);
      response.body.products.forEach((product) => {
        const productSubcategoriesIds = product.subcategories.map(
          (subcategory) => subcategory._id,
        );

        expect(productSubcategoriesIds.includes(subcategoryId)).toBe(true);
      });
      expect(response.body.products.length).toBe(2);
    });

    test('it should get products sorted by sold column', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ sortColumn: 'sold', perPage: 3 });

      expect(response.body.products.length).toBe(3);
      expect(response.body.products[0].sold).toBe(250);
      expect(response.body.products[0].title).toBe('Watermelon');
      expect(response.body.products[1].sold).toBe(235);
    });

    test('it should not get any products if incomplete search text is provided', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ perPage: 12, text: 'lapt' });

      expect(response.body.products.length).toBe(0);
    });

    test('it should get products if complete search text is provided', async () => {
      const response = await request(app)
        .get('/v1/products')
        .query({ perPage: 12, text: 'laptop' });

      expect(response.body.products.length).toBe(2);
      expect(response.body.products[0].title).toContain('Laptop');
    });
  });

  describe('Get product controller', () => {
    test('it should get product by id, populated with its category', async () => {
      const response = await request(app)
        .get(`/v1/products/${products[0]._id}`)
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('product.title');
      expect(response.body.product).toHaveProperty('category.name');
    });

    test('it should return not found error for not existing product', async () => {
      const response = await request(app)
        .get('/v1/products/62b2eb398026fa12fca84822')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    test('it should return resource not found for invalid mongo id', async () => {
      const response = await request(app)
        .get('/v1/products/hello')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Resource not found');
    });
  });

  describe('Create product controller', () => {
    test('it should create a product successfully', async () => {
      const response = await request(app)
        .post('/v1/products')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .field('title', 'Test Product 123456789')
        .field('description', 'Some test product 123456789')
        .field('price', 21.24)
        .field('quantity', 234)
        .field('shipping', 'No')
        .field('color', 'Blue')
        .field('brand', 'Test product brand 123456789')
        .field('category', categories[0]._id)
        .field('subcategories', '61b27f4a8c18d90664b9b7f3')
        .field('subcategories', '61b27f4e8c18d90664b9b7f9')
        .attach('newImages', Buffer.from('mock-image-data-1'), {
          filename: 'test-image-1.jpg',
          contentType: 'image/jpeg',
        })
        .attach('newImages', Buffer.from('mock-image-data-2'), {
          filename: 'test-image-2.jpg',
          contentType: 'image/jpeg',
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'product.title',
        'Test Product 123456789',
      );
      expect(response.body).toHaveProperty('product.price', 21.24);
    });

    test('it should return error if the user is not seller', async () => {
      const response = await request(app)
        .post('/v1/products')
        .set('Cookie', [`jwt=${signJwtToken(users[8]._id)}`])
        .field('title', 'Test product 238900')
        .field('description', 'Test product description 238900')
        .field('price', 21.24)
        .field('quantity', 234)
        .field('shipping', 'No')
        .field('color', 'Blue')
        .field('brand', 'Test brand 238900')
        .field('category', categories[0]._id)
        .field('subcategories', '61b27f4a8c18d90664b9b7f3')
        .attach('newImages', Buffer.from('mock-image-data-1'), {
          filename: 'test-image-1.jpg',
          contentType: 'image/jpeg',
        })
        .expect('Content-Type', /application\/json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'User is not authorized to access this route',
      );
    });

    test('it should return error subcategories are at least 1 subcategory is not provided', async () => {
      const response = await request(app)
        .post('/v1/products')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .field('title', 'Winter jacket')
        .field('description', 'Very nice jacket')
        .field('price', 234.99)
        .field('quantity', 12)
        .field('shipping', 'Yes')
        .field('color', 'Brown')
        .field('brand', 'Cool Clothes')
        .field('category', categories[1]._id)
        .attach('newImages', Buffer.from('mock-image-data-1'), {
          filename: 'test-image-1.jpg',
          contentType: 'image/jpeg',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"subcategories" is required',
      );
    });
  });

  describe('Update product controller', () => {
    test('it should update the title, rest properties should stay the same', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ title: 'Dark Chocolate' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(products[0]).toHaveProperty('title', 'Milky Chocolate');
      expect(response.body).toHaveProperty('product.title', 'Dark Chocolate');
      expect(response.body).toHaveProperty('product.price', 3.45);
    });

    test('it should return error if the title is too long', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({
          title:
            'Some very long testing title with length more than 32 characters',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"title" length must be less than or equal to 32 characters long',
      );
    });

    test('it should return error if we are updating category with invalid id type', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ title: 'New cool title', category: 'invalid-id' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"category" with value "invalid-id" fails to match the Invalid id pattern',
      );
    });

    test('it should return error for too high price', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ price: 100000 })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"price" must be less than or equal to 99999',
      );
    });

    test('it should return error if the user is not seller', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[5]._id)}`])
        .send({ title: 'Dark Chocolate' })
        .expect('Content-Type', /application\/json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'User is not authorized to access this route',
      );
    });

    test('it should return error for not existing product id', async () => {
      const response = await request(app)
        .patch('/v1/products/21b280ee8cbd2875f54ed9ab')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ title: 'Dark Chocolate' })
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('Delete product controller', () => {
    test('it should delete the product', async () => {
      await request(app)
        .delete(`/v1/products/${products[1]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .expect(204);
    });
  });

  describe('Rate product controller', () => {
    test('it should rate the product', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[4]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ rating: 2 })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.product.ratings[0]).toHaveProperty('stars', 2);
      expect(response.body.product.ratings.length).toBe(1);
    });

    test('if the same user rates twice the latest rate overrides the previous', async () => {
      await request(app)
        .patch(`/v1/products/${products[5]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ rating: 3 });

      const response = await request(app)
        .patch(`/v1/products/${products[5]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ rating: 4 });

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.product.ratings[0]).toHaveProperty('stars', 4);
      expect(response.body.product.ratings[0].postedBy).toBe(users[1]._id);
      expect(response.body.product.ratings.length).toBe(1);
    });

    test('if 2 different users are rating a product, both rates are saved', async () => {
      await request(app)
        .patch(`/v1/products/${products[6]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ rating: 1 })
        .expect(200);

      const response = await request(app)
        .patch(`/v1/products/${products[6]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[2]._id)}`])
        .send({ rating: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.product.ratings.length).toBe(2);
    });

    test('should return error if the rating is not a valid number', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[6]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[2]._id)}`])
        .send({ rating: 'two' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"rating" must be a number',
      );
    });

    test('should return error if the rating is not an integer', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[6]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[2]._id)}`])
        .send({ rating: 1.5 })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"rating" must be an integer',
      );
    });

    test('should return error if rating is not provided', async () => {
      const response = await request(app)
        .patch(`/v1/products/${products[6]._id}/rate`)
        .set('Cookie', [`jwt=${signJwtToken(users[2]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '"rating" is required');
    });
  });

  describe('Get similar products controller', () => {
    test('it should return products with the same category as the selected product', async () => {
      const response = await request(app)
        .get(`/v1/products/${products[4]._id}/similar`)
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalCount', 4);

      const productsCategories = response.body.products.map(
        (product) => product.category._id,
      );
      const uniqueCategories = new Set(productsCategories);
      expect(uniqueCategories.size).toBe(1);
    });

    test('the selected product should not be in the returned products', async () => {
      const selectedProductId = products[4]._id;
      const response = await request(app)
        .get(`/v1/products/${selectedProductId}/similar`)
        .expect('Content-Type', /application\/json/)
        .expect(200);

      const productsIds = response.body.products
        .map((product) => product._id)
        .filter((productId) => productId === selectedProductId);
      expect(productsIds.length).toBe(0);
    });
  });

  describe('Get products brands controller', () => {
    test('it should return all products unique brands names', async () => {
      const response = await request(app)
        .get('/v1/products/brands')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.brands)).toBe(true);
      expect(response.body.brands.length).toBe(17);
      expect(response.body.brands).toContain('Asius');
      expect(response.body.brands).toContain('Future2050');
    });
  });
});
