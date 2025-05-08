const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const loginRoutes = require('./routes/login');
const profileRoutes = require('./routes/profile');
const publicProfileRoutes = require('./routes/publicProfile');
const contactRoutes = require('./routes/contact');

const app = express();

// Middleware
const allowedOrigins = ['https://nfc-frontend-pearl.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route prefixes (✅ separates conflicting dynamic routes)
app.use('/api/admin', adminRoutes);           // Admin tools
app.use('/api/auth', authRoutes);             // Activation
app.use('/api/login', loginRoutes);           // Login
app.use('/api/profile', profileRoutes);       // Authenticated profile (by ID)
app.use('/api/public', publicProfileRoutes);  // Public view (by activation code)
app.use('/api/contact', contactRoutes);

// Fallback route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });