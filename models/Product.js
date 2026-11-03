
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  brand: { type: String, default: '' },
  category: { type: String, default: 'Other' },
  purchaseDate: { type: Date, required: true },
  purchasePrice: { type: Number, default: 0 },
  warrantyStartDate: { type: Date },
  warrantyEndDate: { type: Date },
  invoice: { type: String, default: '' },
  description: { type: String, default: '' },

  // Tracks the warranty expiry date already emailed
  reminderSentFor: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
