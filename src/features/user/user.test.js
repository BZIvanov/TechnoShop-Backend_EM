const request = require('supertest');

const { mongoDbConnect, mongoDbDisconnect } = require('../../db/mongo');
const getApp = require('../../app/express');
const User = require('./user.model');
const { signJwtToken } = require('./utils/jwtToken');
const users = require('../../../data-seed/users.json');
const sendEmail = require('../../providers/mailer');

const app = getApp();

jest.mock('../../providers/mailer');

describe('User routes', () => {
  beforeAll(async () => {
    await mongoDbConnect();

    await User.create(users);
  });

  afterAll(async () => {
    await mongoDbDisconnect();
  });

  describe('Register user controller', () => {
    test('it should register an user successfully', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({ username: 'Ivo', email: 'ivo@mail.com', password: '1Uio!#689' })
        .expect('Content-Type', /application\/json/)
        .expect(
          'Set-Cookie',
          /jwt=.+\sMax-Age=86400;\sPath=\/;\sExpires=.+;\sHttpOnly;\sSecure/,
        )
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).not.toHaveProperty('email');
      expect(response.body).toHaveProperty('user.username', 'Ivo');
      expect(response.body).toHaveProperty('user.role', 'buyer');
      expect(response.body).not.toHaveProperty('user.password');
    });

    test('it should register as seller successfully', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'TestSeller',
          email: 'test.seller123@mail.com',
          password: '1Uio!#689',
          role: 'seller',
        })
        .expect('Content-Type', /application\/json/)
        .expect(201);

      expect(response.body).toHaveProperty('user.role', 'seller');
    });

    test('it should not allow to register with exisitng email', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'NewAdmin',
          email: 'admin@mail.com',
          password: '1Uio!#689',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User already exists',
      });
    });

    test('it should not allow to register with incorrect email', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({ username: 'Milko', email: 'milko@mail', password: '1Uio!#689' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: '"email" must be a valid email',
      });
    });

    test('it should not allow to register with incorrect role', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'TestAdmin',
          email: 'test.admin@mail.com',
          password: '1Uio!#689',
          role: 'admin',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Role must be either "buyer" or "seller"',
      });
    });

    test('it should not allow to register with too long username', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'Ivaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          email: 'iva11@mail',
          password: '1Uio!#689',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error:
          '"username" length must be less than or equal to 30 characters long',
      });
    });

    test('it should not allow to register with non schema props', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'Ivelina',
          email: 'ivelina@mail.com',
          password: '1Uio!#689',
          testProp: 'admin', // joi will reject any key which is not part of the validation schema
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: '"testProp" is not allowed',
      });
    });

    test('it should not allow register with simple password', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'Milena',
          email: 'milena@mail.com',
          password: '123456789',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error:
          'Password must contain at least one uppercase, lowercase, number, special char and legnth 8-30',
      });
    });

    test('it should not allow register with password not containing special characters', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'Milena',
          email: 'milena@mail.com',
          password: '123UIty78',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error:
          'Password must contain at least one uppercase, lowercase, number, special char and legnth 8-30',
      });
    });

    test('it should not allow register with too short password', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          username: 'Milena',
          email: 'milena@mail.com',
          password: '1Uj$',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error:
          'Password must contain at least one uppercase, lowercase, number, special char and legnth 8-30',
      });
    });
  });

  describe('Login user controller', () => {
    test('it should login an user successfully', async () => {
      const response = await request(app)
        .post('/v1/users/login')
        .send({ email: users[2].email, password: '12qwAS!@' })
        .expect('Content-Type', /application\/json/)
        .expect(
          'Set-Cookie',
          /jwt=.+\sMax-Age=86400;\sPath=\/;\sExpires=.+;\sHttpOnly;\sSecure/,
        )
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).not.toHaveProperty('email');
      expect(response.body).toHaveProperty('user.username', 'seller1');
      expect(response.body).not.toHaveProperty('user.password');
    });

    test('it should send cors headers', async () => {
      await request(app)
        .post('/v1/users/login')
        .send({ email: 'pepi@mail.com', password: '1Uio!#689' })
        .expect('access-control-allow-origin', 'http://localhost:5173');
    });

    test('it should not allow to login with invalid email', async () => {
      const response = await request(app)
        .post('/v1/users/login')
        .send({ email: 'pepi@mail', password: '1Uio!#689' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: '"email" must be a valid email',
      });
    });

    test('it should not allow to login with not exisiting email', async () => {
      const response = await request(app)
        .post('/v1/users/login')
        .send({ email: 'pepi223@mail.com', password: '1Uio!#689' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid credentials',
      });
    });
  });

  describe('Logout user controller', () => {
    test('it should logout an user successfully', async () => {
      const response = await request(app)
        .post('/v1/users/logout')
        .set('Cookie', [`jwt=${signJwtToken(users[0]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('it should return error message if cookie is not provided', async () => {
      const response = await request(app)
        .post('/v1/users/logout')
        .expect('Content-Type', /application\/json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'You are not logged in');
    });
  });

  describe('Current user controller', () => {
    test('it should get the current user based on the authorization header', async () => {
      const response = await request(app)
        .get('/v1/users/current-user')
        .set('Cookie', [`jwt=${signJwtToken(users[1]._id)}`])
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user._id', users[1]._id);
      expect(response.body).toHaveProperty('user.username', users[1].username);
      expect(response.body).toHaveProperty('user.role', 'seller');
    });

    test('it should still return success response in case no user is found', async () => {
      const response = await request(app)
        .get('/v1/users/current-user')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user', null);
    });

    test('it should return error if the token expired', async () => {
      const token = signJwtToken('6171c360168d11250b4e15d9', '1s');

      // wait a second and a half for the token to expire
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });

      const response = await request(app)
        .get('/v1/users/current-user')
        .set('Cookie', [`jwt=${token}`])
        .expect('Content-Type', /application\/json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'jwt expired');
    });
  });

  describe('Forgot password controller', () => {
    test('it should send an email if valid email was provided', async () => {
      sendEmail.mockResolvedValue({});

      const response = await request(app)
        .post('/v1/users/forgot-password')
        .send({ email: users[8].email })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'You will soon receive an email, if the provided email was valid.',
      );
    });

    test('it should return success response for not existing email', async () => {
      const response = await request(app)
        .post('/v1/users/forgot-password')
        .send({ email: 'not-existing@mail.com' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'You will soon receive an email, if the provided email was valid.',
      );
    });

    test('it should return error if email is not provided', async () => {
      const response = await request(app)
        .post('/v1/users/forgot-password')
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '"email" is required');
    });

    test('it should return error if additional keys are provided', async () => {
      const response = await request(app)
        .post('/v1/users/forgot-password')
        .send({ email: 'ivo@mail.com', text: 'Test text' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '"text" is not allowed');
    });
  });

  describe('Update password controller', () => {
    test('it should return success for correct request', async () => {
      const response = await request(app)
        .patch('/v1/users/update-password')
        .set('Cookie', [`jwt=${signJwtToken(users[8]._id)}`])
        .send({ oldPassword: users[8].password, newPassword: '2Cio!$589' })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('it should return error if the old password is incorrect', async () => {
      const response = await request(app)
        .patch('/v1/users/update-password')
        .set('Cookie', [`jwt=${signJwtToken(users[8]._id)}`])
        .send({ oldPassword: 'aa77JKA$%%12a', newPassword: '3Uip!#589' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Incorrect password');
    });

    test('it should return error if one of the passwords is not provided', async () => {
      const response = await request(app)
        .patch('/v1/users/update-password')
        .set('Cookie', [`jwt=${signJwtToken(users[8]._id)}`])
        .send({ newPassword: '1Cip!#589' })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'error',
        '"oldPassword" is required',
      );
    });

    test('it should return error if authentication/cookie header is not provided', async () => {
      const response = await request(app)
        .patch('/v1/users/update-password')
        .send({ oldPassword: '1Uty!#689', newPassword: '1Eio!#689' })
        .expect('Content-Type', /application\/json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'You are not logged in');
    });
  });

  describe('Reset password controller', () => {
    test('it should return error if no user matches the provided token', async () => {
      const user = await User.findOne({ email: users[8].email });
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      const response = await request(app)
        .post('/v1/users/reset-password')
        .send({
          token: resetToken,
          newPassword: '3Eio!#689',
        })
        .expect('Content-Type', /application\/json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Your password was successfully reset. Try to login now',
      );
    });

    test('it should return error if no user matches the provided token', async () => {
      const response = await request(app)
        .post('/v1/users/reset-password')
        .send({
          token: '4ba681b26bb397ebebf16315cc821c8d723c4813',
          newPassword: '1Eio!#689',
        })
        .expect('Content-Type', /application\/json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
