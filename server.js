require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Expose public Flutterwave key to the website (never the secret key)
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.__FLW_PUBLIC_KEY__ = '${process.env.FLW_PUBLIC_KEY || ''}';`);
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', require('./routes/users'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/artists', require('./routes/artists'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/recognize', require('./routes/recognize'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎵 Sonara website running on http://localhost:${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas — API routes active');
  })
  .catch((err) => {
    console.error('⚠️  MongoDB connection failed:', err.message);
    console.error('   Website is still running. API routes will not work until DB is connected.');
    console.error('   Fix: go to MongoDB Atlas → Network Access → Add your IP address.');
  });
