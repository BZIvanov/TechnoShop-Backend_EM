const request = require('supertest');
const cloudinary = require('cloudinary').v2;

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const getApp = require('../../app/express');
const User = require('../user/user.model');
const Category = require('./category.model');
const { signJwtToken } = require('../user/utils/jwtToken');
const users = require('../../../data-seed/users.json');
const categories = require('../../../data-seed/categories.json');

const app = getApp();

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    config: jest.fn(),
  },
}));

cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
  const mockUploadResult = {
    public_id: 'fixed-public-id',
    secure_url: 'http://mock-cloudinary-url.com/category-image.jpg',
  };
  callback(null, mockUploadResult);
  return { end: jest.fn() };
});

cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

describe('Category routes', () => {
  beforeAll(async () => {
    await mongoDbConnect();

    await User.create(users);
    await Category.create(categories);
  });

  afterAll(async () => {
    await mongoDbDisconnect();
  });

  describe('Get categories controller', () => {
    test('it should get categories successfully', async () => {
      const response = await request(app)
        .get('/v1/categories')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categories');
      expect(response.body.categories[0]).toHaveProperty('_id');
      expect(response.body.categories[0]).toHaveProperty('createdAt');
      expect(response.body.categories[0]).toHaveProperty('updatedAt');
      expect(response.body.categories[0]).toHaveProperty('name');
      expect(response.body.categories[0]).toHaveProperty('slug');
    });

    test('with helmet, it should not send x-powered-by header, which is usually applied by express', async () => {
      const response = await request(app)
        .get('/v1/categories')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.headers).not.toHaveProperty('x-powered-by');
    });

    test('with helmet, it should send content-security-policy header', async () => {
      const response = await request(app)
        .get('/v1/categories')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.headers).toHaveProperty('content-security-policy');
    });

    test('with helmet, it should send strict-transport-security header', async () => {
      const response = await request(app)
        .get('/v1/categories')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    test('it should return an error for too many requests', async () => {
      // TODO there are not many tests so the default limit of 100 is fine, but if many more tests are added future refactoring might be needed, where enhancedApp is used for all the tests with bigger limit
      const enhancedApp = getApp({
        limiterOptions: {
          windowMs: 1 * 60 * 1000,
          max: 2,
          message: 'Too many requests from this IP, please try again later',
          handler: (req, res, next, options) =>
            res
              .status(options.statusCode)
              .json({ success: false, error: options.message }),
        },
      });
      await request(enhancedApp)
        .get('/v1/categories')
        .expect('Content-Type', /application\/json/)
        .expect(200);
      await request(enhancedApp)
        .get('/v1/categories')
        .expect('Content-Type', /application\/json/)
        .expect(200);
      const response = await request(enhancedApp)
        .get('/v1/categories')
        .expect('Content-Type', /application\/json/)
        .expect(429);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'Too many requests from this IP, please try again later',
      );
    });
  });

  describe('Create category controller', () => {
    test('it should create a category successfully', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`]) // If we were using jwt tokens without cookies, we would set Authorization header instead
        .field({ categoryName: 'Shoes' })
        .attach('categoryImage', Buffer.from('mock-image-data'), {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg',
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('category.name', 'Shoes');
      expect(response.body).toHaveProperty('category.slug', 'shoes');
      expect(response.body.category.image).toHaveProperty('publicId');
      expect(response.body.category.image).toHaveProperty('imageUrl');
    });

    test('it should return error if the user is not admin', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ categoryName: 'Dresses' })
        .expect('Content-Type', /application\/json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'User is not authorized to access this route',
      );
    });

    test('it should return error if extra keys are provided', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .field({ categoryName: 'Test 23456', testProp: 'laptops' })
        .attach('categoryImage', Buffer.from('mock-image-data'), {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"testProp" is not allowed',
      );
    });

    test('it should return error if too long category name is provided', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .field({ categoryName: 'Summer clothes for the hot summer' })
        .attach('categoryImage', Buffer.from('mock-image-data'), {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"categoryName" length must be less than or equal to 32 characters long',
      );
    });
  });

  describe('Get category controller', () => {
    test('it should get a category successfully', async () => {
      const categoryId = categories[0]._id;
      const response = await request(app)
        .get(`/v1/categories/${categoryId}`)
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('category._id', categoryId);
      expect(response.body).toHaveProperty('category.name', categories[0].name);
      expect(response.body).toHaveProperty('category.slug', categories[0].slug);
    });

    test('it should return product not found for not existing id', async () => {
      const response = await request(app)
        .get('/v1/categories/5199473165bcf27b81cae571')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Category not found');
    });

    test('it should return resource not found for not invalid id', async () => {
      const response = await request(app)
        .get('/v1/categories/hello')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Resource not found');
    });
  });

  describe('Update category controller', () => {
    test('it should update category successfully', async () => {
      const categoryId = categories[0]._id;
      const response = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .send({ categoryName: 'Updated Name' })
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('category._id', categoryId);
      expect(response.body).toHaveProperty('category.name', 'Updated Name');
      expect(response.body).toHaveProperty('category.slug', 'updated-name');
    });

    test('it should return not found for invalid id', async () => {
      const categoryId = '5199473165bcf27b81cae571';
      const response = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({ categoryName: 'My new name' })
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Category not found');
    });

    test('it should return not logged in error if authorization header is not provided', async () => {
      const categoryId = '5199473165bcf27b81cae571';
      const response = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .send({ categoryName: 'My new category' })
        .expect('Content-Type', /application\/json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'You are not logged in');
    });

    test('it should return error if category name is too short', async () => {
      const categoryId = categories[0]._id;
      const response = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({ categoryName: 'C' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"categoryName" length must be at least 2 characters long',
      );
    });
  });

  describe('Delete category controller', () => {
    test('it should delete existing category successfully', async () => {
      const categoryId = categories[0]._id;
      await request(app)
        .delete(`/v1/categories/${categoryId}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect(204);
    });

    test('it should return not found for invalid id', async () => {
      const categoryId = '5199473165bcf27b81cae571';
      const response = await request(app)
        .delete(`/v1/categories/${categoryId}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Category not found');
    });

    test('it should return not logged in error if authorization header is not provided', async () => {
      const categoryId = '5199473165bcf27b81cae571';
      const response = await request(app)
        .delete(`/v1/categories/${categoryId}`)
        .expect('Content-Type', /application\/json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'You are not logged in');
    });

    test('it should return error if the user is not admin', async () => {
      const categoryId = '5199473165bcf27b81cae571';
      const response = await request(app)
        .delete(`/v1/categories/${categoryId}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'User is not authorized to access this route',
      );
    });
  });
});
