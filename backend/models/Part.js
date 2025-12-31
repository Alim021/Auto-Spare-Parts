const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  shopName: { type: String, required: true },
  shopLocation: { type: String, required: true },
  email: { type: String, required: true },
  quantity_owned: { type: Number, default: 1, min: 0 },
  part_number: { type: String, required: true },
  gst_rate: { 
    type: String,
    enum: ['0', '5', '12', '18', '28'],
    default: '18'
  },
  hsn_code: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\d{4,8}$/.test(v);
      },
      message: 'HSN code must be 4-8 digits'
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Part', partSchema);