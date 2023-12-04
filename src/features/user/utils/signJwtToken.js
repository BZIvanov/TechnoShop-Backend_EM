const jwt = require('jsonwebtoken');

const signJwtToken = (userId, expiresIn = '1d') => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn,
  });

  return token;
};

module.exports = signJwtToken;
