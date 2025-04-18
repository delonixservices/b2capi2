const express = require('express');
const router = express.Router();

const {
  suggest,
  searchHotels,
  searchPackages,
  bookingpolicy,
  prebook,
  transactions,
  cancelBooking,
  invoice,
  voucher
} = require('../controllers/hotelsController');

const {
  processPayment,
  paymentResponseHandler
} = require('../controllers/paymentController');

const isAuth = require('../middleware/isAuth');

router.post('/suggest', suggest);

router.post('/search', searchHotels);

router.post('/packages', searchPackages);

router.post('/bookingpolicy', bookingpolicy);

router.post('/prebook', prebook);

router.post('/transactions', isAuth, transactions);

router.post('/cancel', isAuth, cancelBooking);

router.get('/invoice', isAuth, invoice);

router.get('/voucher', isAuth, voucher);

// payment routes

router.get('/process-payment/:id', processPayment);

router.post('/payment-response-handler', paymentResponseHandler);

module.exports = router;