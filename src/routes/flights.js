const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');

const {
  flightSearch,
  flightPrice,
  processOrder,
  orderRetrieve,
  cancelOrder,
  getTransactions,
  transactionStatus,
  getTransaction,
  voucher
} = require('../controllers/flights/flightsController');

const {
  processPayment,
  paymentResponseHandler
} = require('../controllers/flights/paymentController');

router.get('/', (req, res) => {
  res.json({
    'message': 'Tripbazaar flights api...'
  });
});

router.post('/flight-search', flightSearch);

router.post('/flight-price', flightPrice);

router.post('/order-process', processOrder);

router.post('/order-retrieve', orderRetrieve);

router.post('/order-cancel', cancelOrder);

router.post('/transactions', isAuth, getTransactions);

router.post('/transaction-status', isAuth, transactionStatus);

router.get('/transaction/:id', isAuth, getTransaction);

// @FIXME: isAuth not applied
router.get('/voucher', voucher);


// Payment controller

router.get('/process-payment/:id', processPayment);

router.post('/payment-response-handler', paymentResponseHandler);

module.exports = router;