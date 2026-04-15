const express = require('express');
const router = express.Router();
const {
  createService,
  getAllServices,
  getService,
  updateService,
  deleteService,
  getMyServices
} = require('../controllers/serviceController');
const { createServiceValidation, updateServiceValidation } = require('../validations/serviceValidation');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

// Public routes
router.get('/', getAllServices);
router.get('/:id', getService);

// Protected routes (Provider only)
router.use(auth);
router.get('/me/services', getMyServices);
router.post('/', authorize('provider'), validate(createServiceValidation), createService);
router.put('/:id', authorize('provider'), validate(updateServiceValidation), updateService);
router.delete('/:id', authorize('provider'), deleteService);

module.exports = router;