const mongoose = require('mongoose');

const shopOwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  shop_name: { type: String, required: true },
  shop_location: { type: String, required: true },
  gst_number: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShopOwner', shopOwnerSchema);