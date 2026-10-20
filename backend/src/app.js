const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const qaRoutes = require('./routes/qaRoutes');
const shiftRightRoutes = require('./routes/shiftRightRoutes');

const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const { pool } = require('./config/db');

const app = express();

// Middlewares globaux
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Journalisation HTTP (désactivée en mode test pour des sorties propres)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Point de terminaison Santé / Healthcheck
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as is_alive');
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: rows.length > 0 ? 'CONNECTED' : 'DISCONNECTED',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: 'ERROR',
      error: error.message
    });
  }
});

// Montage des routes API
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/shift-right', shiftRightRoutes);

// Gestion des routes inexistantes et des erreurs
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
