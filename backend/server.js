const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('📋 ENV check → NODE_ENV:', process.env.NODE_ENV, '| JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? '✅ loaded' : '❌ MISSING');

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB      = require('./config/db');
const passport       = require('./config/passport');
const errorHandler   = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const jobRoutes          = require('./routes/jobRoutes');
const applicationRoutes  = require('./routes/applicationRoutes');
const savedJobRoutes     = require('./routes/savedJobRoutes');
const adminRoutes        = require('./routes/adminRoutes');

connectDB();

const app = express();

app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());
app.use('/api', apiLimiter);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV, version: '1.0.0' })
);

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jobs',          jobRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/saved-jobs',    savedJobRoutes);
app.use('/api/admin',         adminRoutes);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// Raw error logger — prints actual error before errorHandler formats it
app.use((err, req, res, next) => {
  console.error('🔴 RAW ERROR:', err.message);
  console.error(err.stack?.split('\n').slice(0, 3).join('\n'));
  next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 HireHub API running → http://localhost:${PORT}`)
);

module.exports = app;