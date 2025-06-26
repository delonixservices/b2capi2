const url = require('url');
const Api = require('../../services/apiService');
const Transaction = require('../../models/HotelTransaction');
const Mail = require('../../services/mailService');

const logger = require('../../config/logger');

const {
  generateInvoice
} = require('../../utils/invoice');

const {
  generateVoucher
} = require('../../utils/voucher');

const {
  getPaginationParams,
  paginateQuery
} = require('../../utils/pagination');

const ccavanue = require('../../utils/ccavanue');
const jtfd = require('json-to-form-data');

const {
  accessCode,
  workingKey
} = require('../../config/payment');


exports.allTransactions = async (req, res, next) => {
  try {
    // Get pagination parameters
    const paginationParams = getPaginationParams(req, {
      defaultLimit: 20,
      maxLimit: 100
    });

    // Get paginated transactions
    const result = await paginateQuery(
      Transaction,
      {}, // empty query to get all transactions
      {
        sort: { created_at: -1 }
      },
      paginationParams
    );

    // Status mapping
    // 0  initial state
    // 1  booking success
    // 2  booking cancelled
    // 3  payment pending
    // 4  payment success
    // 5  booking failed
    // 6  payment failed
    // 7  payment refunded
    const getStatus = ["pending", "success", "cancelled", "payment_pending", "payment_success", "booking_failed", "payment_failed", "refunded"];

    const allTransactions = [];

    result.data.forEach((trans) => {
      let base_amount, service_charges, processing_fee, gst, chargeable_rate;

      // for old transactions
      if (trans.pricing) {
        base_amount = trans.pricing.base_amount_discount_included;
        chargeable_rate = trans.pricing.total_chargeable_amount;
        service_charges = trans.pricing.service_charges || 0;
        processing_fee = trans.pricing.processing_fee || 0;
        gst = trans.pricing.gst || 0;
      } else {
        base_amount = trans.prebook_response.data.package.chargeable_rate;
        chargeable_rate = trans.prebook_response.data.package.chargeable_rate;
        service_charges = 0;
        processing_fee = 0;
        gst = 0;
      }

      const newTrans = {
        'id': trans._id,
        'hotelName': trans.hotel.name,
        'createdAt': trans.created_at,
        'check_in_date': trans.prebook_response.data.package.check_in_date,
        'check_out_date': trans.prebook_response.data.package.check_out_date,
        'room_count': trans.prebook_response.data.package.room_count,
        'first_name': trans.contactDetail.name,
        'last_name': trans.contactDetail.last_name,
        'coupon_used': trans.coupon.code ? trans.coupon.code : "-",
        'base_amount': Math.round(base_amount * 100) / 100,
        'service_charges': Math.round(service_charges * 100) / 100,
        'processing_fee': Math.round(processing_fee * 100) / 100,
        'gst': Math.round(gst * 100) / 100,
        'chargeable_rate': Math.round(chargeable_rate * 100) / 100,
        'transaction_status': getStatus[trans.status]
      }

      allTransactions.push(newTrans);
    });

    res.json({
      "status": 200,
      "data": allTransactions,
      "pagination": result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  const transactionId = req.query.transactionId;
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return res.status(404).send('Invalid transactionId');
  }

  if (transaction.status != 1) {
    return res.status(422).json({
      'message': 'Cannot get invoice for incomplete transaction'
    });
  }

  let buffer;
  try {
    buffer = await generateInvoice(transaction);
  } catch (err) {
    console.log('Cannot get voucher for the given transaction');
    console.log(err);

    return res.status(422).json({
      'message': 'Cannot get voucher for the given transaction'
    });
  }

  res.header('Content-type', 'application/pdf');
  res.send(buffer);
}

exports.getVoucher = async (req, res, next) => {
  const transactionId = req.query.transactionId;

  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return res.status(404).send('Invalid transactionId');
  }

  if (transaction.status != 1) {
    return res.status(422).json({
      'message': 'Cannot get voucher for incomplete transaction'
    });
  }

  let buffer;
  try {
    buffer = await generateVoucher(transaction);
  } catch (err) {
    console.log('Cannot get voucher for the given transaction');
    console.log(err);

    return res.status(422).json({
      'message': 'Cannot get voucher for the given transaction'
    });
  }

  res.header('Content-type', 'application/pdf');

  res.send(buffer);
}


exports.sendVoucherInvoice = async (req, res, next) => {

  const transactionId = req.body.transactionId;

  let toEmail = req.body.email;

  let transaction;
  try {
    transaction = await Transaction.findById(transactionId);
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      'message': 'Cannot find any transaction by this transaction id'
    });
  }

  // if no email provided sent the email to the registered email of the user
  if (!toEmail) {
    toEmail = transaction.contactDetail.email;
  }

  let invoiceBuffer = await generateInvoice(transaction);
  invoiceBuffer = invoiceBuffer.toString('base64');
  let voucherBuffer = await generateVoucher(transaction);
  voucherBuffer = voucherBuffer.toString('base64');

  const msg = {
    to: toEmail,
    subject: 'TripBazaar Confim Ticket',
    text: `Dear ${transaction.contactDetail.name}, Your Hotel ${transaction.hotel.originalName} has been booked and the bookingId is ${transactionId}. Thank you !`,
    attachments: [{
      filename: 'Invoice.pdf',
      content: invoiceBuffer,
      type: 'application/pdf',
      disposition: 'attachment',
      contentId: 'myId'
    }, {
      filename: 'Voucher.pdf',
      content: voucherBuffer,
      type: 'application/pdf',
      disposition: 'attachment',
      contentId: 'myId'
    }],
    html: `Dear ${transaction.contactDetail.name}, Your Hotel ${transaction.hotel.originalName} has been booked and the booking reference no. is ${transactionId}. Thank you !`,
  };

  try {
    Mail.send(msg);

    res.json({
      'message': 'Invoice and Voucher sent to the mail successfully'
    })
  } catch (err) {
    console.log("Failed to send mail", err);
  }
}

exports.processRefund = async (req, res) => {

  const transactionId = req.body.transactionId;

  const transaction = await Transaction.findOne({
    "_id": transactionId
  });

  if (!transaction) {
    return res.status(404).json({
      message: "Invalid transaction id, please try again"
    });
  }

  const payload = {
    'reference_no': transaction.payment_response.tracking_id,
    'refund_amount': transaction.payment_response.amount,
    "refund_ref_no": transaction.payment_response.order_id
  }

  const payloadString = JSON.stringify(payload);

  const enc_data = ccavanue.encrypt(payloadString, workingKey);

  const requestBody = {
    'enc_request': enc_data,
    'access_code': accessCode,
    'request_type': 'JSON',
    'response_type': 'JSON',
    'command': 'refundOrder',
    'reference_no': transaction.payment_response.tracking_id,
    'refund_amount': transaction.payment_response.amount,
    "refund_ref_no": transaction.payment_response.order_id,
    'version': '1.1'
  };

  logger.info(payload);

  const requestBodyString = jtfd(requestBody);
  logger.info('Refund Order...');
  logger.info(requestBodyString);

  // @TODO do not run the refund api if refund is already processed

  const resData = await Api.post('https://apitest.ccavenue.com/apis/servlet/DoWebTrans', requestBodyString);

  logger.info(resData);

  const parsedResponse = url.parse("/?" + resData, true).query;

  logger.info('OrderRefund Response...');
  // logger.info(parsedResponse);
  console.log(parsedResponse);

  if (parsedResponse.status != 0) {
    return res.status(400).json({
      'status': 'failed',
      'message': 'Unable to process the request.'
    });
  }

  const decryptResponse = ccavanue.decrypt(parsedResponse.enc_response, workingKey);

  const decryptResponseObj = JSON.parse(decryptResponse);

  logger.info('Decrypted Response...');
  console.log(decryptResponseObj);

  if (decryptResponseObj.refund_status != 0) {
    return res.json({
      'status': 'refund failed',
      'message': 'Cannot initiate refund request for the given order. Refund request failed.'
    });
  }

  transaction.status = 7; // refunded
  transaction.refund_response = decryptResponseObj;

  res.json({
    'status': 'success',
    'message': 'Refund successful',
    'data': decryptResponseObj
  });

  await transaction.save();
}

exports.orderStatus = async (req, res) => {

  const transactionId = req.body.transactionId;

  const transaction = await Transaction.findOne({
    "_id": transactionId
  });

  if (!transaction) {
    return res.status(404).json({
      message: "Invalid transaction id, please try again"
    });
  }

  const payload = {
    'reference_no': transaction.payment_response.tracking_id,
    "order_no": transaction.payment_response.order_id
  }

  const payloadString = JSON.stringify(payload);

  const enc_data = ccavanue.encrypt(payloadString, workingKey);

  const requestBody = {
    'enc_request': enc_data,
    'access_code': accessCode,
    'request_type': 'JSON',
    'response_type': 'JSON',
    'command': 'orderStatusTracker',
    'reference_no': transaction.payment_response.tracking_id,
    'order_no': transaction.payment_response.order_id,
    'version': '1.1'
  };

  console.log(payload);

  const requestBodyString = jtfd(requestBody);
  logger.info('Refund Order...');
  logger.info(requestBodyString);

  const resData = await Api.post('https://apitest.ccavenue.com/apis/servlet/DoWebTrans', requestBodyString);

  logger.info(resData);

  const parsedResponse = url.parse("/?" + resData, true).query;

  logger.info('OrderStatus Response...');
  console.log(parsedResponse);

  if (parsedResponse.status != 0) {
    return res.status(400).json({
      'status': 'failed',
      'message': 'Unable to process the request.'
    });
  }

  const decryptResponse = ccavanue.decrypt(parsedResponse.enc_response, workingKey);

  const decryptResponseObj = JSON.parse(decryptResponse);

  logger.info('Decrypted Response...');
  console.log(decryptResponseObj);

  // if (decryptResponseObj.refund_status !== 0) {
  //   return res.json({
  //     'status': 'failed',
  //     'message': 'Cannot complete order status request for the given order. Order Status request failed.'
  //   });
  // }

  res.json({
    'status': 'success',
    'data': decryptResponseObj
  });

  await transaction.save();
}

exports.orderConfirm = async (req, res) => {

  const transactionId = req.body.transactionId;

  const transaction = await Transaction.findOne({
    "_id": transactionId
  });

  if (!transaction) {
    return res.status(404).json({
      message: "Invalid transaction id, please try again"
    });
  }

  const payload = {
    "order_List": [{
      'reference_no': transaction.payment_response.tracking_id,
      'amount': transaction.payment_response.amount,
    }]
  }

  const payloadString = JSON.stringify(payload);

  const enc_data = ccavanue.encrypt(payloadString, workingKey);

  const requestBody = {
    'enc_request': enc_data,
    'access_code': accessCode,
    'request_type': 'JSON',
    'response_type': 'JSON',
    'command': 'confirmOrder',
    'reference_no': transaction.payment_response.tracking_id,
    'amount': transaction.payment_response.amount,
    'version': '1.1'
  };

  logger.info(payload);

  const requestBodyString = jtfd(requestBody);
  logger.info('Confirm Order...');
  logger.info(requestBodyString);

  const resData = await Api.post('https://apitest.ccavenue.com/apis/servlet/DoWebTrans', requestBodyString);

  logger.info(resData);

  const parsedResponse = url.parse("/?" + resData, true).query;

  logger.info('Order Confirm Response...');
  // logger.info(parsedResponse);
  console.log(parsedResponse);

  if (parsedResponse.status != 0) {
    return res.status(400).json({
      'status': 'failed',
      'message': 'Unable to process the request.'
    });
  }

  const decryptResponse = ccavanue.decrypt(parsedResponse.enc_response, workingKey);

  const decryptResponseObj = JSON.parse(decryptResponse);

  logger.info('Decrypted Response...');
  console.log(decryptResponseObj);

  // if (decryptResponseObj.refund_status !== 0) {
  //   return res.json({
  //     'status': 'refund failed',
  //     'message': 'Cannot initiate refund request for the given order. Refund request failed.'
  //   });
  // }

  res.json({
    'status': 'success',
    'data': decryptResponseObj
  });
}