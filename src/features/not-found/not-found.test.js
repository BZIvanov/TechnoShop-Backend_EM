const request = require('supertest');

const app = require('../../app/express');

describe('Not found routes', () => {
  describe('Not found controller', () => {
    test('it should return not found for invalid get route', async () => {
      const response = await request(app)
        .get('/invalid-route')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'GET on route /invalid-route was not found.',
      });
    });

    test('it should return not found for invalid post route', async () => {
      const response = await request(app)
        .post('/some-route')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'POST on route /some-route was not found.',
      });
    });

    test('it should return not found for invalid put route', async () => {
      const response = await request(app)
        .put('/amazing-products/12345')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'PUT on route /amazing-products/12345 was not found.',
      });
    });

    test('it should return not found for invalid index route', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /application\/json/)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'GET on route / was not found.',
      });
    });
  });
});
