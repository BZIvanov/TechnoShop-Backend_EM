const jwt = require('jsonwebtoken');

const { environment } = require('../../../config/environment');

const signJwtToken = (userId, expiresIn = '1d') => {
  const token = jwt.sign({ id: userId }, environment.JWT_SECRET, {
    expiresIn,
  });

  return token;
};

module.exports = { signJwtToken };
