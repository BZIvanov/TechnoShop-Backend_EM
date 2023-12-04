const { cookieName } = require('../user.constants');

const setJwtCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    // sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };

  res.cookie(cookieName, token, cookieOptions);
};

const clearJwtCookie = (res) => {
  res.clearCookie(cookieName);
};

module.exports = { setJwtCookie, clearJwtCookie };
