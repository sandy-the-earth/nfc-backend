// middleware/adminAuth.js

module.exports = function adminAuth(req, res, next) {
    const clientKey = req.header('x-admin-key');
    const serverKey = process.env.ADMIN_SECRET_KEY;
  
    if (!clientKey || clientKey !== serverKey) {
      return res.status(401).json({ message: 'Unauthorized: Admin access denied' });
    }
  
    next();
  };  