// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  // Define the email options
  const mailOptions = {
    from: 'muhammadabdullahakram2002@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // Actually send email (using nodemailers)
  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
