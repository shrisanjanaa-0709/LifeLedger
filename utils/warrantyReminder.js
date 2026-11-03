
const Product = require('../models/Product');
const User = require('../models/User');
const { sendWarrantyEmail } = require('./emailService');

// Find warranties expiring within the next 7 days
async function runWarrantyReminderCheck() {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    const products = await Product.find({
      warrantyEndDate: {
        $gte: now,
        $lte: sevenDaysLater
      }
    });

    for (const product of products) {
      // Avoid sending the same reminder twice
      if (
        product.reminderSentFor &&
        new Date(product.reminderSentFor).getTime() ===
        new Date(product.warrantyEndDate).getTime()
      ) {
        continue;
      }

      const user = await User.findById(product.userId);

      if (!user || !user.email) continue;

      try {
        const previewUrl = await sendWarrantyEmail(
          user.email,
          product.productName,
          product.warrantyEndDate
        );

        // Mark the reminder only after successful sending
        product.reminderSentFor = product.warrantyEndDate;
        await product.save();

        console.log(`Reminder sent for ${product.productName}`);
        console.log('Preview email:', previewUrl);

      } catch (emailError) {
        console.error(
          `Failed to send reminder for ${product.productName}:`,
          emailError.message
        );
      }
    }

    console.log('Warranty reminder check completed');

  } catch (error) {
    console.error('Warranty reminder check failed:', error.message);
  }
}

// Manual email test for presentation
async function sendManualWarrantyTest(productId, userId) {
  const product = await Product.findOne({
    _id: productId,
    userId
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (!product.warrantyEndDate) {
    throw new Error('This product has no warranty end date');
  }

  const user = await User.findById(userId);

  if (!user || !user.email) {
    throw new Error('User email not found');
  }

  return await sendWarrantyEmail(
    user.email,
    product.productName,
    product.warrantyEndDate
  );
}

module.exports = {
  runWarrantyReminderCheck,
  sendManualWarrantyTest
};
