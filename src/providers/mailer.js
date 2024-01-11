const nodemailer = require('nodemailer');

const { environment } = require('../config/environment');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    auth: {
      user: environment.SMTP_USERNAME,
      pass: environment.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${environment.FROM_NAME} <${environment.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
