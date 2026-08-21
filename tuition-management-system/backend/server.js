const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/db');
const { ensureSeeded } = require('./utils/seed');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Login/register will fail. Add JWT_SECRET to your environment variables.');
}

initializeDatabase();

const app = express();

app.use(cors());
app.use(express.json());

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
