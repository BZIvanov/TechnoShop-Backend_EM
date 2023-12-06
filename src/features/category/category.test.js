const request = require('supertest');

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const app = require('../../app/express');
const User = require('../user/user.model');
const Category = require('./category.model');
const { signJwtToken } = require('../user/utils/jwtToken');
const users = require('../../../data-seed/users.json');
const categories = require('../../../data-seed/categories.json');

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
  });

  describe('Create category controller', () => {
    test('it should create a category successfully', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`]) // If we were using jwt tokens without cookies, we would set Authorization header instead
        .send({ name: 'Shoes' })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('category.name', 'Shoes');
      expect(response.body).toHaveProperty('category.slug', 'shoes');
    });

    test('it should return error if the user is not admin', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ name: 'Dresses' })
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
        .send({ name: 'Laptops', slug: 'laptops' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '"slug" is not allowed');
    });

    test('it should return error if too long category name is provided', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({ name: 'Summer clothes for the hot summer' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"name" length must be less than or equal to 32 characters long',
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
        .send({ name: 'Updated Name' })
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
        .send({ name: 'My new name' })
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Category not found');
    });

    test('it should return not logged in error if authorization header is not provided', async () => {
      const categoryId = '5199473165bcf27b81cae571';
      const response = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .send({ name: 'My new category' })
        .expect('Content-Type', /application\/json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'You are not logged in');
    });

    test('it should return bad request error if category name is not provided', async () => {
      const categoryId = '5199473165bcf27b81cae571';
      const response = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '"name" is required');
    });

    test('it should return error if category name is too short', async () => {
      const categoryId = categories[0]._id;
      const response = await request(app)
        .patch(`/v1/categories/${categoryId}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '"name" is required');
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
