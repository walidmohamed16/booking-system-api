// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

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
    message: ' Booking System API is running!'
  });
});

module.exports = app;