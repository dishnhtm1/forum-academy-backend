const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Create transporter
const createTransporter = () => {
  // For development, we'll use a test account or console logging
  // In production, you'd configure with real SMTP settings
  
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development: Log emails to console
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
};

// Send reply email
const sendReplyEmail = async (to, subject, message, replyType = 'contact') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@forumacademy.com',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">
              ${replyType === 'contact' ? 'Reply to Your Message' : 'Application Update'}
            </h2>
            <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
              <p style="color: #2c3e50; margin: 0; font-size: 14px;">
                <strong>Forum Academy</strong><br>
                Thank you for your interest in our programs.
              </p>
            </div>
          </div>
        </div>
      `
    };

    if (process.env.NODE_ENV === 'production') {
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } else {
      // Development: Log email content
      console.log('📧 Email would be sent in production:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Message:', message);
      console.log('-------------------');
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

// Send application status update email
const sendApplicationStatusEmail = async (to, applicantName, status, message = '') => {
  const statusMessage = {
    approved: 'Congratulations! Your application has been approved.',
    rejected: 'Thank you for your application. Unfortunately, we cannot proceed at this time.',
    pending: 'Your application is currently under review.'
  };

  const defaultMessage = statusMessage[status] || 'Your application status has been updated.';
  const fullMessage = message || defaultMessage;

  const subject = `Application Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  
  return await sendReplyEmail(to, subject, `
Dear ${applicantName},

${fullMessage}

If you have any questions, please don't hesitate to contact us.

Best regards,
Forum Academy Admissions Team
  `, 'application');
};

module.exports = {
  sendReplyEmail,
  sendApplicationStatusEmail
};