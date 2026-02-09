const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const config = require('./config/env');

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true, // Echo origin to support credentials: true (required for some browsers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));

// Routes
app.use('/api', routes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Travel Partner CRM API',
    version: '1.0.0',
  });
});

// Explicit Test Route
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Error Handler
app.use(errorHandler);

module.exports = app;
