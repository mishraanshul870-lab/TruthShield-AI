import './config/loadEnv.js';
import { verifyOpenAIKey } from './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'url';

// Configurations & Database
import { connectDB } from './config/db.js';
import { protect } from './middleware/auth.js';
import { Scan, Notification } from './config/models.js';

// Controllers
import { registerUser, loginUser, getUserProfile, getUserStats, updateUserProfile, updateUserPassword, forgotPassword, resetPassword } from './controllers/authController.js';
import { analyzeText, verifyUrl, analyzeImage, analyzeVideo, getScanHistory } from './controllers/analyzeController.js';
import { getDashboardStats } from './controllers/dashboardController.js';
import { uploadPdf, uploadImage, uploadVideo } from './middleware/upload.js';
import { getNotifications, createNotification, markAllAsRead, markAsRead, deleteNotification } from './controllers/notificationController.js';
import { generatePDFReport } from './utils/pdfGenerator.js';

// ES Module dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- REQUEST & RESPONSE LOGGING MIDDLEWARE ---
const truncateLargeData = (obj) => {
  if (typeof obj === 'string') {
    if (obj.length > 500) {
      return `${obj.substring(0, 500)}... [TRUNCATED ${obj.length} chars]`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(truncateLargeData);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = truncateLargeData(obj[key]);
    }
    return newObj;
  }
  return obj;
};

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n========================================`);
  console.log(`[${timestamp}] 📥 INCOMING REQUEST: ${req.method} ${req.url}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '[REDACTED]';
    console.log(`Body:`, JSON.stringify(truncateLargeData(logBody), null, 2));
  } else {
    console.log(`Body: (empty)`);
  }
  console.log(`========================================`);

  // Intercept the response JSON sending to log outgoing API responses
  const originalJson = res.json;
  res.json = function (data) {
    console.log(`\n========================================`);
    console.log(`[${new Date().toISOString()}] 📤 OUTGOING RESPONSE for ${req.method} ${req.url}`);
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Response Payload:`, JSON.stringify(truncateLargeData(data), null, 2));
    console.log(`========================================`);
    return originalJson.apply(this, arguments);
  };

  next();
});

// 1. HTTP Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. Strict CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://truthshield-frontend.onrender.com'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow extension requests (which may have no origin or start with chrome-extension://)
    if (!origin || origin.startsWith('chrome-extension://')) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Serve static uploads (for debugging, though uploaded files are deleted post-scan)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Brute-force security check: too many auth attempts. Please try again after 15 minutes.' }
});

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 45,
  message: { message: 'Scanning rate limit breached. Please try again after 15 minutes.' }
});

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TruthShield AI Backend is active.' });
});

// Authentication Routes
app.post('/api/auth/register', authLimiter, registerUser);
app.post('/api/auth/login', authLimiter, loginUser);
app.get('/api/auth/profile', protect, getUserProfile);
app.get('/api/auth/stats', protect, getUserStats);
app.put('/api/auth/profile', protect, updateUserProfile);
app.put('/api/auth/password', protect, updateUserPassword);
app.post('/api/auth/forgot-password', authLimiter, forgotPassword);
app.post('/api/auth/reset-password/:token', authLimiter, resetPassword);

// Dashboard Stats Route (aggregation-optimized)
app.get('/api/dashboard/stats', protect, getDashboardStats);

// Analysis Routes (Rate-Limited to prevent DoS on heavy AI computation models)
app.post('/api/analyze/text', protect, scanLimiter, uploadPdf, analyzeText);
app.post('/api/analyze/url', protect, scanLimiter, verifyUrl);
app.post('/api/analyze/image', protect, scanLimiter, uploadImage, analyzeImage);
app.post('/api/analyze/video', protect, scanLimiter, uploadVideo, analyzeVideo);
app.get('/api/analyze/history', protect, getScanHistory);

// Delete a single scan by ID
app.delete('/api/analyze/history/:id', protect, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: 'Scan record not found.' });
    }
    if (scan.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this scan.' });
    }
    await Scan.deleteById(req.params.id);
    res.json({ message: 'Scan deleted successfully.' });
  } catch (error) {
    console.error('Delete scan error:', error);
    res.status(500).json({ message: 'Failed to delete scan record.' });
  }
});

// Delete all scans for the current user
app.delete('/api/analyze/history', protect, async (req, res) => {
  try {
    const result = await Scan.deleteMany({ userId: req.user.id });
    res.json({ message: `Cleared ${result.deletedCount || 0} scan records.` });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ message: 'Failed to clear scan history.' });
  }
});

// Notification Routes
app.get('/api/notifications', protect, getNotifications);
app.post('/api/notifications', protect, createNotification);
app.put('/api/notifications/read', protect, markAllAsRead);
app.put('/api/notifications/:id/read', protect, markAsRead);
app.delete('/api/notifications/:id', protect, deleteNotification);

// Download PDF Report Route
app.get('/api/analyze/report/:id', protect, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: 'Scan report not found.' });
    }

    if (scan.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this scan report.' });
    }

    generatePDFReport(scan, res, req.query.lang || 'en');

    try {
      await Notification.create({
        userId: req.user.id,
        title: 'Report Generated',
        message: `PDF forensic report downloaded for ${scan.type} scan: "${scan.content.substring(0, 30)}${scan.content.length > 30 ? '...' : ''}"`,
        type: 'success'
      });
    } catch (err) {
      console.error('[Notification report error]:', err);
    }
  } catch (error) {
    console.error('PDF generation endpoint error:', error);
    res.status(500).json({ message: 'Failed to generate report PDF.' });
  }
});

// 4. Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  let statusCode = err.status || 500;
  if (err.name === 'MulterError' || err.message?.includes('Invalid file type') || err.message?.includes('File size exceeds')) {
    statusCode = 400;
  }
  res.status(statusCode).json({
    message: err.message || 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Express Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Perform OpenAI key verification audit on startup asynchronously
    console.log('🔍 Auditing OpenAI API Key status...');
    verifyOpenAIKey().then((verifyResult) => {
      if (verifyResult.valid) {
        console.log(`✅ [OPENAI AUDIT SUCCESS] ${verifyResult.message}`);
      } else {
        console.warn(`⚠️ [OPENAI AUDIT WARNING] ${verifyResult.message}`);
      }
    }).catch(err => {
      console.error('⚠️ [OPENAI AUDIT ERROR] Failed during verification check:', err.message);
    });

    app.listen(PORT, () => {
      console.log(`📡 TruthShield Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    console.error('❌ Failed to start TruthShield server:', error);
    process.exit(1);
  }
};

startServer();
