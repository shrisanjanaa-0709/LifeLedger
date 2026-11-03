
const nodemailer = require('nodemailer');

async function sendWarrantyEmail(to, productName, expiryDate) {
  try {
    // Connect to Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    // Send the warranty reminder email
    const info = await transporter.sendMail({
      from: `"LifeLedger" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'LifeLedger - Warranty Expiry Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">
            LifeLedger Warranty Reminder
          </h2>

          <p>Hello!</p>

          <p>
            Your product <b>${productName}</b>
            warranty is approaching its expiry date.
          </p>

          <p>
            <b>Warranty Expiry Date:</b>
            ${new Date(expiryDate).toDateString()}
          </p>

          <p>
            Please check your warranty details and contact
            the manufacturer if needed.
          </p>

          <p>Thank you for using LifeLedger!</p>
        </div>
      `
    });

    console.log('Email sent successfully!');
    console.log('Recipient:', to);
    console.log('Message ID:', info.messageId);

    return info.messageId;

  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
}

module.exports = { sendWarrantyEmail };
