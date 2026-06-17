const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/songs', require('./routes/songs'));
app.use('/api/artists', require('./routes/artists'));
app.use('/api/users', require('./routes/users'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Sonara API! 🎵' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Sonara server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.log('❌ MongoDB connection error:', error);
  });