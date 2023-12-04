const setJwtCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    // sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };

  res.cookie('jwt', token, cookieOptions);
};

module.exports = setJwtCookie;
