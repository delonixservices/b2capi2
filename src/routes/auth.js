const express = require('express');
const router = express.Router();
const {
  body
} = require('express-validator');

const User = require('../models/User');

const {
  register,
  login,
  logout,
  refreshToken,
  authUser,
  verifyUser,
  verifyOtp,
  forgotPassword,
  resetPassword,
  updateUserProfile,
  updateMobile,
  updatePassword
} = require('../controllers/authController');

const isAuth = require('../middleware/isAuth');



// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working!' });
});



// other routes
router.post('/register', [
  body('name')
  .trim()
  .not()
  .isEmpty(),
  body('last_name')
  .trim()
  .not()
  .isEmpty(),
  body('mobile')
  .isLength({
    min: 10,
    max: 10
  })
  .custom(async (value) => {
    await User.findOne({
      'mobile': value
    }).then(doc => {
      if (doc) {
        throw new Error('User with this mobile no already exists');
      }
    })
  }),
  body('email', 'Please enter valid email.')
  .isEmail()
  .normalizeEmail(),
  body('password', 'Password should be of minimum 8 characters')
  .trim()
  .isLength({
    min: 8
  })
], register);

router.post('/login', [
  body('mobile')
  .isLength({
    min: 10,
    max: 10
  }),
  body('password', 'Password should be of minimum 8 characters')
  .trim()
  .isLength({
    min: 8
  })
], login);

router.post('/logout', isAuth, logout);

router.post('/refresh', [
  body('refreshToken', 'Invalid refresh token')
  .trim()
  .not()
  .isEmpty()
], refreshToken);

router.post('/otp-verify', [
  body('otp', 'Please enter valid otp')
  .trim()
  .not()
  .isEmpty(),
  body('userId', 'Invalid user id')
  .trim()
  .not()
  .isEmpty()
], verifyOtp);

router.get('/me', isAuth, authUser);

router.post('/user-verify', isAuth, [
  body('otp', 'Please enter valid otp')
  .trim()
  .not()
  .isEmpty(),
  body('userId', 'Invalid user id')
  .trim()
  .not()
  .isEmpty()
], verifyUser);

router.post('/password-forgot', [
  body('mobile')
  .isLength({
    min: 10,
    max: 10
  })
], forgotPassword);

router.post('/password-reset', [
  body('userId', 'Invalid user id')
  .trim()
  .not()
  .isEmpty(),
  body('password', 'Please enter valid password')
  .trim()
  .not()
  .isEmpty(),
  body('password_reset_token')
  .trim()
  .not()
  .isEmpty(),
], resetPassword);

router.post('/user-profile', [
  body('userId', 'Invalid user id')
  .trim()
  .not()
  .isEmpty(),
  body('name')
  .trim()
  .not()
  .isEmpty(),
  body('last_name')
  .trim()
  .not()
  .isEmpty(),
  body('email', 'Please enter valid email.')
  .isEmail()
  .normalizeEmail(),
], isAuth, updateUserProfile);

router.post('/password-update', [
  body('userId', 'Invalid user id')
  .trim()
  .not()
  .isEmpty(),
  body('password', 'Please enter valid password')
  .trim()
  .not()
  .isEmpty(),
  body('newPassword', 'newPassword should be of minimum 8 characters')
  .trim()
  .isLength({
    min: 8
  })
], isAuth, updatePassword);

// router.post('/mobile-update',isAuth, updateMobile);


module.exports = router;