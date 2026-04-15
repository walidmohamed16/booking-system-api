const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

const auth = async (req, res, next) => {
  try {
    // 1. Check if token exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError('You are not logged in. Please login first', 401));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError('User no longer exists', 401));
    }

    // 4. Add user to request
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError('Invalid token. Please login again', 401));
  }
};

module.exports = auth;