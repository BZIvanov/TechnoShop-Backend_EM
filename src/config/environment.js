require('dotenv').config(); // reusable file so we don't need to import dtoenv everywhere we need the env variables

module.exports.environment = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URI: process.env.DATABASE_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  FROM_EMAIL: process.env.FROM_EMAIL,
  FROM_NAME: process.env.FROM_NAME,
};
