const userModel = 'user';

const userRoles = {
  admin: 'admin',
  seller: 'seller',
  buyer: 'buyer',
};

const registerMethods = {
  email: 'email',
};

const cookieName = 'jwt'; // not the best name, it is just for this demo project

module.exports = {
  userModel,
  userRoles,
  registerMethods,
  cookieName,
};
