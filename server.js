const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env
dotenv.config();

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const loginRoutes = require('./routes/login');
const profileRoutes = require('./routes/profile');
const publicProfileRoutes = require('./routes/publicProfile');

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes BEFORE static fallback
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/public', publicProfileRoutes);

// Serve frontend build
app.use(express.static(path.join(__dirname, 'build')));

// Wildcard fallback (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(5000, () => console.log('🚀 Server running at http://localhost:5000'));
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});