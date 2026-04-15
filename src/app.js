const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/apiError');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Test Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Booking System API is running!'
  });
});

// Handle undefined routes
app.use((req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

module.exports = app;