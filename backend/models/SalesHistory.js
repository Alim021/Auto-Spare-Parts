const mongoose = require('mongoose');

const salesHistorySchema = new mongoose.Schema({
  part_id: { type: String, required: true },
  part_number: { type: String, required: true },
  part_name: { type: String, required: true },
  customer_name: { type: String, required: true },
  quantity_sold: { type: Number, required: true, min: 1 },
  selling_price: { type: Number, required: true, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  gst_rate: { type: String, enum: ['0', '5', '12', '18', '28'] },
  sgst_amount: { type: Number, default: 0, min: 0 },
  cgst_amount: { type: Number, default: 0, min: 0 },
  shop_email: { type: String, required: true },
  invoice_number: { type: String },
  sale_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SalesHistory', salesHistorySchema);