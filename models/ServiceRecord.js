const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  serviceDate: { type: Date, required: true },
  serviceType: { type: String, required: true },
  description: { type: String, default: '' },
  serviceCost: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ServiceRecord', serviceSchema);
