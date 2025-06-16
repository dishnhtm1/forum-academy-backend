// // utils/emailService.js
// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// const sendEmail = async ({ to, subject, text }) => {
//   const mailOptions = {
//     from: `"Forum Academy" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     text
//   };

//   try {
//     const result = await transporter.sendMail(mailOptions);
//     console.log('✅ Email sent:', result.response);
//   } catch (error) {
//     console.error('❌ Email sending failed:', error);
//     throw error;
//   }
// };

// module.exports = { sendEmail };
