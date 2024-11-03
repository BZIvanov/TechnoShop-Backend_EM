const request = require('supertest');

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const getApp = require('../../app/express');
const User = require('../user/user.model');
const Product = require('../product/product.model');
const Coupon = require('../coupon/coupon.model');
const Order = require('./order.model');
const { signJwtToken } = require('../user/utils/jwtToken');
const users = require('../../../data-seed/users.json');
const products = require('../../../data-seed/products.json');
const coupons = require('../../../data-seed/coupons.json');
const orders = require('../../../data-seed/orders.json');

const app = getApp();

describe('Order routes', () => {
  beforeAll(async () => {
    await mongoDbConnect();

    await User.create(users);
    await Product.create(products);
    await Coupon.create(coupons);
    await Order.create(orders);
  });

  afterAll(async () => {
    await mongoDbDisconnect();
  });

  describe('Get orders controller', () => {
    test('admin should be get access to all the orders', async () => {
      const response = await request(app)
        .get('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalCount', 9);
      expect(response.body).toHaveProperty('orders');
    });

    test('it should return user orders successfully', async () => {
      const response = await request(app)
        .get('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[4]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalCount', 4);
      expect(response.body).toHaveProperty('orders');
    });
  });

  describe('Create order controller', () => {
    test('it should create an order with correct total price and default status order', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({
          cart: [
            { count: 2, product: products[0]._id },
            { count: 3, product: products[1]._id },
          ],
          address: 'Some test street 23',
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      const product1TotalPrice = 2 * products[0].price;
      const product2TotalPrice = 3 * products[1].price;
      const totalPrice = product1TotalPrice + product2TotalPrice;
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.totalAmount).toBe(totalPrice);
      expect(response.body.order.orderStatus).toBe('Not Processed');
    });

    test('it should create an order with correct total price and deducted coupon', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({
          cart: [
            { count: 2, product: products[0]._id },
            { count: 3, product: products[1]._id },
          ],
          address: 'Some test street 23',
          coupon: coupons[3].name,
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      const product1TotalPrice = 2 * products[0].price;
      const product2TotalPrice = 3 * products[1].price;
      const couponDiscountPercent = coupons[3].discount / 100;
      const totalPrice = product1TotalPrice + product2TotalPrice;
      const priceWithDiscount = totalPrice - totalPrice * couponDiscountPercent;
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.totalAmount).toBe(priceWithDiscount);
    });

    test('it should reduce the product quantity and increase sold value for the ordered product', async () => {
      const orderCount = 5;
      await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[2]._id)}`])
        .send({
          cart: [{ count: orderCount, product: products[12]._id }],
          address: 'Some test street 23',
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      const product = await Product.findById(products[12]._id);

      const updatedProductQuantity = products[12].quantity - orderCount;
      expect(product.quantity).toBe(updatedProductQuantity);
      const updatedProductSold = products[12].sold + orderCount;
      expect(product.sold).toBe(updatedProductSold);
    });

    test('it should return an error for insuficient product quantity', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({
          cart: [{ count: products[1].quantity + 1, product: products[1]._id }],
          address: 'Some test street 23',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'Insufficient product quantity',
      );
    });

    test('it should return an error for expired coupon', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({
          cart: [{ count: 1, product: products[2]._id }],
          address: 'Some test street 23',
          coupon: coupons[15].name,
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        'This coupon has already expired.',
      );
    });
  });

  describe('Update order status controller', () => {
    test('it should update users order successfully if admin', async () => {
      const response = await request(app)
        .patch(`/v1/orders/${orders[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .send({ orderStatus: 'Completed' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('order.orderStatus', 'Completed');
    });

    test('it should return an error if the user is not admin', async () => {
      const response = await request(app)
        .patch(`/v1/orders/${orders[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ orderStatus: 'Cancelled' })
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
