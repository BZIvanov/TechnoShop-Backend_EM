const jwt = require('jsonwebtoken');

const { ENV_VARS } = require('../../../config/environment');

const signJwtToken = (userId, expiresIn = '1d') => {
  const token = jwt.sign({ id: userId }, ENV_VARS.JWT_SECRET, {
    expiresIn,
  });

  return token;
};

module.exports = { signJwtToken };
