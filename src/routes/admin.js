const express = require('express');
const router = express.Router();

// for register route
const Admin = require('../models/Admin');
const isAdmin = require('../middleware/isAdmin');

// for handling multipart/form-data
const multer = require('multer');

const smsService = require('../services/smsService');

// config multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage
});

const {
  body,
  validationResult
} = require('express-validator');

const {
  addBanner,
  allBanners,
  editBanner,
  deleteBanner
} = require('../controllers/admin/bannersController');

const {
  addCoupon,
  allCoupons,
  editCoupon,
  deleteCoupon
} = require('../controllers/admin/couponsController');

const {
  addFlightOffer,
  allFlightOffers,
  editFlightOffer,
  deleteFlightOffer
} = require('../controllers/admin/flightOffersController');

const {
  addHolidayOffer,
  allHolidayOffers,
  editHolidayOffer,
  deleteHolidayOffer
} = require('../controllers/admin/holidayOffersController');

const {
  addHotelOffer,
  allHotelOffers,
  editHotelOffer,
  deleteHotelOffer
} = require('../controllers/admin/hotelOffersController');

const {
  AddSpecialOffer,
  allSpecialOffers,
  editSpecialOffer,
  deleteSpecialOffer
} = require('../controllers/admin/specialOffersController');

const {
  allTransactions,
  getVoucher,
  getInvoice,
  sendVoucherInvoice,
  processRefund,
  orderStatus,
  orderConfirm
} = require('../controllers/admin/transactionsController');

const {
  register,
  login,
  logout,
  allUsers,
  updateUser
} = require('../controllers/admin/usersController');

const {
  getConfig,
  editConfig
} = require('../controllers/admin/configController');

const {
  generatePayment,
  processPayment,
  paymentResponseHandler,
  allPayments,
  paymentStatus
} = require('../controllers/admin/paymentController');

const {
  apiHistory
} = require('../controllers/admin/historyController');

const {
  addVendor,
  getAllVendors,
  editVendor,
  getAllVendorTransactions
} = require('../controllers/admin/metaSearchController');

router.post('/banners', isAdmin, upload.single('image'), addBanner);

router.get('/banners', isAdmin, allBanners);

router.put('/banners', isAdmin, upload.single('image'), editBanner);

router.delete('/banners', isAdmin, deleteBanner);


router.post('/coupons', isAdmin, upload.single('image'), addCoupon);

router.get('/coupons', isAdmin, allCoupons);

router.put('/coupons', isAdmin, editCoupon);

router.delete('/coupons', isAdmin, deleteCoupon);


router.post('/flight-offers', isAdmin, upload.single('image'), addFlightOffer);

router.get('/flight-offers', isAdmin, allFlightOffers);

router.put('/flight-offers', isAdmin, upload.single('image'), editFlightOffer);

router.delete('/flight-offers', isAdmin, deleteFlightOffer);


router.post('/holiday-offers', isAdmin, upload.single('image'), addHolidayOffer);

router.get('/holiday-offers', isAdmin, allHolidayOffers);

router.put('/holiday-offers', isAdmin, upload.single('image'), editHolidayOffer);

router.delete('/holiday-offers', isAdmin, deleteHolidayOffer);


router.post('/hotel-offers', isAdmin, upload.single('image'), addHotelOffer);

router.get('/hotel-offers', isAdmin, allHotelOffers);

router.put('/hotel-offers', isAdmin, upload.single('image'), editHotelOffer);

router.delete('/hotel-offers', isAdmin, deleteHotelOffer);


router.post('/special-offers', isAdmin, upload.single('image'), AddSpecialOffer);

router.get('/special-offers', isAdmin, allSpecialOffers);

router.put('/special-offers', isAdmin, upload.single('image'), editSpecialOffer);

router.delete('/special-offers', isAdmin, deleteSpecialOffer);


router.get('/transactions', isAdmin, allTransactions);

router.get('/voucher', isAdmin, getVoucher);

router.get('/invoice', isAdmin, getInvoice);

// Refund
router.post('/refund-process', isAdmin, processRefund);

router.post('/order-status', isAdmin, orderStatus);

router.post('/order-confirm', isAdmin, orderConfirm);


// comment out register route after creating admin user
router.post('/register', [
  body('email', 'Please enter valid email.')
  .isEmail()
  .normalizeEmail()
  .custom(async (value) => {
    await Admin.findOne({
      'email': value
    }).then(doc => {
      if (doc) {
        throw new Error('Admin with this email already exists');
      }
    })
  }),
  body('mobile', 'Please enter valid mobile no.')
  .trim()
  .isLength({
    min: 10,
    max: 10
  }),
  body('password', 'Password should be of minimum 8 characters')
  .trim()
  .isLength({
    min: 8
  })
], register);

router.post('/login', [
  body('email', 'Please enter valid email.')
  .isEmail()
  .normalizeEmail(),
  body('password', 'Password should be of minimum 8 characters')
  .trim()
  .isLength({
    min: 8
  })
], login);

router.post('/logout', [
  body('refreshToken', 'Invalid refresh token')
  .trim()
  .not()
  .isEmpty()
], isAdmin, logout);

router.get('/users', isAdmin, allUsers);

router.put('/users', isAdmin, updateUser);

router.get('/config', isAdmin, getConfig);

router.put('/config', isAdmin, editConfig);


// generate payment link
router.post('/payment-generate', [
  body('name', 'Field name should not be empty.')
  .not()
  .isEmpty(),
  body('amount', 'amount should be greater than or equals to 100.')
  .isInt({
    allow_leading_zeroes: true,
    gt: 99
  })
], isAdmin, generatePayment);

router.get('/payment-process/:id', processPayment);

router.post('/payment-response', paymentResponseHandler);

router.get('/payments', isAdmin, allPayments);

router.get('/payment-status/:id', paymentStatus);

router.get('/api-history', apiHistory);

router.post('/send-sms', [
  body('mobile', 'Please enter valid mobile no')
  .isNumeric()
  .isLength({
    min: 10,
    max: 10
  }),
  body('message', 'Please enter valid message')
  .isString()
  .not()
  .isEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed!');
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
    }

    const to = req.body.mobile;
    const msg = req.body.message;

    const data = await smsService.send(to, msg);

    console.log(data);

    return res.json({
      'status': 200,
      'message': 'Message sent successfully'
    });

  } catch (err) {
    console.log(err);
  }
});

router.post('/send-voucher-invoice', sendVoucherInvoice);

// meta-search
router.post('/meta-search/vendor', addVendor);

router.get('/meta-search/vendor-all', getAllVendors);

router.put('/meta-search/vendor', editVendor);

router.get('/meta-search/:id/transactions', getAllVendorTransactions);

module.exports = router;