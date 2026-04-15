const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validations/authValidation');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/me', auth, getMe);

module.exports = router;