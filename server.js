const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

const allowedOrigins = [
  'https://commacards.com',                       // ✅ your live domain
  'https://www.commacards.com',                   // ✅ (optional if using www)
  'http://localhost:3000',                        // ✅ for local dev
  'https://nfc-frontend-pearl.vercel.app',        // (optional)
  'https://skyblue-pig-834243.hostingersite.com'  // (optional)
];

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

app.options('*', cors());
app.use(express.json());

// Static file serving
console.log('📁 Setting up static file serving for /uploads');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route Imports with Logs
console.log('⏳ Importing adminRoutes...');
const adminRoutes = require('./routes/admin');
console.log('✅ adminRoutes OK');

console.log('⏳ Importing authRoutes...');
const authRoutes = require('./routes/auth');
console.log('✅ authRoutes OK');

console.log('⏳ Importing loginRoutes...');
const loginRoutes = require('./routes/login');
console.log('✅ loginRoutes OK');

console.log('⏳ Importing profileRoutes...');
const profileRoutes = require('./routes/profile');
console.log('✅ profileRoutes OK');

console.log('⏳ Importing publicProfileRoutes...');
const publicProfileRoutes = require('./routes/publicProfile');
console.log('✅ publicProfileRoutes OK');

console.log('⏳ Importing contactRoutes...');
const contactRoutes = require('./routes/contact');
console.log('✅ contactRoutes OK');

console.log('✅ All route files imported');

// Route Mounting with Logs
try {
  console.log('📦 Mounting /api/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Mounted /api/admin');
} catch (err) {
  console.error('❌ Error mounting /api/admin:', err);
}

try {
  console.log('📦 Mounting /api/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Mounted /api/auth');
} catch (err) {
  console.error('❌ Error mounting /api/auth:', err);
}

try {
  console.log('📦 Mounting /api/login');
  app.use('/api/login', loginRoutes);
  console.log('✅ Mounted /api/login');
} catch (err) {
  console.error('❌ Error mounting /api/login:', err);
}

try {
  console.log('📦 Mounting /api/profile');
  app.use('/api/profile', profileRoutes);
  console.log('✅ Mounted /api/profile');
} catch (err) {
  console.error('❌ Error mounting /api/profile:', err);
}

try {
  console.log('📦 Mounting /api/public');
  app.use('/api/public', publicProfileRoutes);
  console.log('✅ Mounted /api/public');
} catch (err) {
  console.error('❌ Error mounting /api/public:', err);
}

try {
  console.log('📦 Mounting /api/contact');
  app.use('/api/contact', contactRoutes);
  console.log('✅ Mounted /api/contact');
} catch (err) {
  console.error('❌ Error mounting /api/contact:', err);
}

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection and server start
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });