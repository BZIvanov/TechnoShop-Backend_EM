const request = require('supertest');

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const getApp = require('../../app/express');
const User = require('../user/user.model');
const Product = require('../product/product.model');
const Coupon = require('../coupon/coupon.model');
const Order = require('./order.model');
const OrderItem = require('./order-item.model');
const { signJwtToken } = require('../user/utils/jwtToken');
const users = require('../../../data-seed/users.json');
const products = require('../../../data-seed/products.json');
const coupons = require('../../../data-seed/coupons.json');
const orders = require('../../../data-seed/orders.json');
const orderItems = require('../../../data-seed/order-items.json');

const app = getApp();

describe('Order routes', () => {
  beforeAll(async () => {
    await mongoDbConnect();

    await User.create(users);
    await Product.create(products);
    await Coupon.create(coupons);
    await Order.create(orders);
    await OrderItem.create(orderItems);
  });

  afterAll(async () => {
    await mongoDbDisconnect();
  });

  describe('Get buyer orders controller', () => {
    test('should get buyer orders successfully', async () => {
      const response = await request(app)
        .get('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalCount', 2);
      expect(response.body.orders[0]).toHaveProperty(
        'deliveryAddress',
        'Test delivery street 12345',
      );
      expect(response.body.orders[0]).toHaveProperty('paymentStatus', 'paid');
      expect(response.body.orders[0]).toHaveProperty('deliveryStatus');
      expect(response.body.orders[0]).toHaveProperty('totalPrice');
      expect(response.body.orders[0]).toHaveProperty('buyer.username', 'buyer');
    });

    test('it should not allow seller user to access buyer orders', async () => {
      const response = await request(app)
        .get('/v1/orders')
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

  describe('Create order controller', () => {
    test('it should create an order with correct total price and default status order', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
        .send({
          cart: [
            { count: 2, product: products[0]._id },
            { count: 3, product: products[1]._id },
          ],
          address: 'Some test street 2315',
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      const product1TotalPrice = 2 * products[0].price;
      const product2TotalPrice = 3 * products[1].price;
      const secondProductDiscount =
        product2TotalPrice * (products[1].discount / 100);
      const totalPrice =
        product1TotalPrice + product2TotalPrice - secondProductDiscount;
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.totalPrice).toBe(totalPrice);
      expect(response.body.order.buyer).toBe('6717d0d1c28f835782943df7');
      expect(response.body.order.deliveryAddress).toBe('Some test street 2315');
    });

    test('it should create an order with correct total price and deducted coupon', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
        .send({
          cart: [{ count: 2, product: products[0]._id }],
          address: 'Some test street 23',
          coupon: coupons[2].name,
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      const product1TotalPrice = 2 * products[0].price;
      const couponDiscountPercent = coupons[2].discount / 100;
      const totalPrice =
        product1TotalPrice - product1TotalPrice * couponDiscountPercent;
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.totalPrice).toBe(totalPrice);
    });

    test('it should reduce the product quantity and increase sold value for the ordered product', async () => {
      const orderCount = 5;
      await request(app)
        .post('/v1/orders')
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
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
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
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
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
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

  describe('Update seller order item status controller', () => {
    test('it should update seller order successfully if seller', async () => {
      const response = await request(app)
        .patch(`/v1/orders/seller/${orderItems[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .send({ deliveryStatus: 'delivered' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('order.deliveryStatus', 'delivered');
    });

    test('it should return an error if the user is not seller', async () => {
      const response = await request(app)
        .patch(`/v1/orders/seller/${orders[0]._id}`)
        .set('Cookie', [`jwt=${signJwtToken(users[3]._id)}`])
        .send({ deliveryStatus: 'canceled' })
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
