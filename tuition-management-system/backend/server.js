const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/db');
const { ensureSeeded } = require('./utils/seed');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  const msg = 'FATAL: JWT_SECRET is not set. Add JWT_SECRET to backend/.env before starting the server.';
  if (process.env.NODE_ENV === 'production') {
    console.error(msg);
    process.exit(1);
  }
  console.warn('WARNING: ' + msg);
}

initializeDatabase();

// contentSecurityPolicy is left off so the existing React UI (inline styles,
// data: QR images) keeps working unchanged; re-enable with a strict policy
// before exposing this app publicly.
const app = express();

// Trust the reverse proxy (Render/Heroku-style) so req.ips/rate limiting work
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Allowed browser origins. The frontend is served by this same Express service
// in production, so same-origin API calls need no CORS entry at all; APP_URL /
// CORS_ORIGIN cover deployments where the frontend is hosted elsewhere.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
if (process.env.APP_URL) allowedOrigins.push(process.env.APP_URL.replace(/\/$/, ''));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));

if (process.env.NODE_ENV === 'production') {
  console.log('CORS allowed origins:', allowedOrigins.join(', ') || '(none)');
}

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/homework', require('./routes/homeworkRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/routine', require('./routes/routineRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureSeeded();
  } catch (err) {
    console.error('Database seed check failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
