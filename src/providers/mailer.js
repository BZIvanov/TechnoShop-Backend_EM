const nodemailer = require('nodemailer');

const { ENV_VARS } = require('../config/environment');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: ENV_VARS.SMTP_HOST,
    port: ENV_VARS.SMTP_PORT,
    auth: {
      user: ENV_VARS.SMTP_USERNAME,
      pass: ENV_VARS.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${ENV_VARS.FROM_NAME} <${ENV_VARS.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
