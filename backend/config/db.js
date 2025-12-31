const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://alimsayyad_db:nafisaalim@cluster0.zawtbr0.mongodb.net/auto_parts_db?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Atlas connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;