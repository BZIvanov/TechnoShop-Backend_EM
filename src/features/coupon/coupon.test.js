const request = require('supertest');

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const app = require('../../app/express');
const User = require('../user/user.model');
const Coupon = require('./coupon.model');
const users = require('../../../data-seed/users.json');
const coupons = require('../../../data-seed/coupons.json');
const { signJwtToken } = require('../user/utils/jwtToken');

describe('Product routes', () => {
  beforeAll(async () => {
    await mongoDbConnect();

    await User.create(users);
    await Coupon.create(coupons);
  });

  afterAll(async () => {
    await mongoDbDisconnect();
  });

  describe('Get coupons controller', () => {
    test('it should get coupons successfully', async () => {
      const response = await request(app)
        .get('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalCount', 16);
      expect(response.body.coupons).toHaveLength(5);
      expect(response.body.coupons[0]).toHaveProperty('name');
      expect(response.body.coupons[0]).toHaveProperty('discount');
    });

    test('it should get the provided number of coupons per page', async () => {
      const response = await request(app)
        .get('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .query({ perPage: 9 })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalCount', 16);
      expect(response.body.coupons).toHaveLength(9);
    });

    test('it should return error if the user is not admin', async () => {
      const response = await request(app)
        .get('/v1/coupons')
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

  describe('Create coupon controller', () => {
    test('it should create coupon successfully', async () => {
      const response = await request(app)
        .post('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({
          name: 'Test coupon name',
          discount: 20,
          expirationDate: new Date('2026-03-15T19:16:45.000Z'),
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('coupon');
      expect(response.body.coupon).toHaveProperty('name');
    });

    test('it should return an error if we try to create coupon with already existing coupon name', async () => {
      const response = await request(app)
        .post('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({
          name: coupons[2].name,
          discount: 20,
          expirationDate: new Date('2026-03-15T19:16:45.000Z'),
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Duplicate field value');
    });

    test('only admin should be able to create a coupon', async () => {
      const response = await request(app)
        .post('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({
          name: 'Test coupon name22',
          discount: 20,
          expirationDate: new Date('2026-03-15T19:16:45.000Z'),
        })
        .expect('Content-Type', /application\/json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'User is not authorized to access this route',
      );
    });

    test('should return error if discount number is too big', async () => {
      const response = await request(app)
        .post('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({
          name: 'Too big discount',
          discount: 200,
          expirationDate: new Date('2026-03-15T19:16:45.000Z'),
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"discount" must be less than or equal to 99.99',
      );
    });

    test('should return error if expirationDate is invalid date', async () => {
      const response = await request(app)
        .post('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({
          name: 'Too big discount',
          discount: 30,
          expirationDate: 'Tomorrow',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"expirationDate" must be in ISO 8601 date format',
      );
    });

    test('should return error if expirationDate is in the past', async () => {
      const response = await request(app)
        .post('/v1/coupons')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({
          name: 'AlreadyExpired',
          discount: 30,
          expirationDate: new Date('2022-03-15T19:16:45.000Z'),
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"expirationDate" must be greater than "now"',
      );
    });
  });

  describe('Delete coupon controller', () => {
    test('it should delete a coupon successfully', async () => {
      await request(app)
        .delete(`/v1/coupons/${coupons[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect(204);
    });

    test('it should reutrn an error if the user is not admin', async () => {
      const response = await request(app)
        .delete(`/v1/coupons/${coupons[1]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'User is not authorized to access this route',
      );
    });

    test('it should reutrn not found for invalid coupon id', async () => {
      const response = await request(app)
        .delete('/v1/coupons/63adbcaa8651a9452410b67e')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Coupon not found');
    });
  });
});
