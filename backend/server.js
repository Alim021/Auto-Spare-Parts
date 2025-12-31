const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes import
const authRoutes = require('./routes/authRoutes');
const partRoutes = require('./routes/partRoutes');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection
connectDB();

// Routes
app.use('/api', authRoutes);
app.use('/api', partRoutes);
app.use('/api', userRoutes);
app.use('/api', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Auto Parts API is running',
    database: 'MongoDB Atlas',
    status: 'Connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: MongoDB Atlas`);
});