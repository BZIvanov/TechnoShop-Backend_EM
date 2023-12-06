const request = require('supertest');

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const app = require('../../app/express');
const User = require('../user/user.model');
const Product = require('../product/product.model');
const Wishlist = require('./wishlist.model');
const { signJwtToken } = require('../user/utils/jwtToken');
const users = require('../../../data-seed/users.json');
const products = require('../../../data-seed/products.json');
const wishlists = require('../../../data-seed/wishlists.json');

describe('Wishlist routes', () => {
  beforeAll(async () => {
    await mongoDbConnect();

    await User.create(users);
    await Product.create(products);
    await Wishlist.create(wishlists);
  });

  afterAll(async () => {
    await mongoDbDisconnect();
  });

  describe('Get wishlist controller', () => {
    test('it should return user wishlist successfully', async () => {
      const response = await request(app)
        .get('/v1/wishlists')
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products[0]).toHaveProperty('title');
      expect(response.body.products[0]).toHaveProperty('brand');
    });

    test('it should return empty wishlist if the user does not have one', async () => {
      const response = await request(app)
        .get('/v1/wishlists')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products).toHaveLength(0);
    });
  });

  describe('Upsert wishlist controller', () => {
    test('it should create the wishlist with selected product if the user does not have a wishlist', async () => {
      const response = await request(app)
        .post(`/v1/wishlists/${products[10]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[2]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0]).toHaveProperty('title');
    });

    test('it should remove the product from the wishlist, if it is already there', async () => {
      const addResponse = await request(app)
        .post(`/v1/wishlists/${products[10]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[6]._id)}`])
        .expect(200);

      expect(addResponse.body).toHaveProperty('success', true);
      expect(addResponse.body.products).toHaveLength(1);

      const removeResponse = await request(app)
        .post(`/v1/wishlists/${products[10]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[6]._id)}`])
        .expect(200);

      expect(removeResponse.body).toHaveProperty('success', true);
      expect(removeResponse.body.products).toHaveLength(0);
    });
  });
});
