const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'sit725gppj@gmail.com',
    pass: process.env.EMAIL_PASS || 'tdaj kahn zkhr kebr',
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: '"Giftzy" <sit725gppj@gmail.com>',
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
