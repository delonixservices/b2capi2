const {
  validationResult
} = require('express-validator');
const randtoken = require('rand-token');

// const Api = require("../../services/apiService");
// const Mail = require("../../services/mailService");
const Sms = require('../../services/smsService');

const ccavanue = require('../../utils/ccavanue');
const jtfd = require("json-to-form-data");
const {
  payment_url,
  merchant_id,
  accessCode,
  workingKey,
} = require('../../config/payment');

const {
  baseUrl,
  clientUrl
} = require('../../config/index');

const Payment = require('../../models/Payment');
// const Transaction = require('../../models/HotelTransaction');

const url = require('url');

const {
  getPaginationParams,
  paginateQuery
} = require('../../utils/pagination');

// const invoice = require('../../utils/invoice');
// const voucher = require('../../utils/voucher');

// getting payment from client
exports.generatePayment = async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  let payment;
  try {
    payment = new Payment({
      "name": req.body.name,
      "amount": req.body.amount
    });
    const paymentId = randtoken.generate(16);

    payment.payment_id = paymentId;

    await payment.save();

  } catch (err) {
    return next(err);
  }

  payment = payment.toObject();
  delete payment._id;

  return res.json({
    'data': payment
  });
}

exports.processPayment = async (req, res, next) => {

  if (!req.params.id) {
    const error = new Error('Payment Id is required');
    error.statusCode = 400;
    return next(error);
  }

  let data;
  try {
    data = await Payment.findOne({
      "payment_id": req.params.id
    });
  } catch (err) {
    return next(err);
  }

  if (!data) {
    const error = new Error('Payment is not complete. Please try again.');
    error.statusCode = 422;
    return next(error);
  }

  const createdAt = new Date(data.created_at).getTime();
  // check if payment link is expired
  // payment link will be expired after 30 days (10*24*60*60*1000 milliseconds) of generation
  const expiry = createdAt + 30 * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() > expiry;

  // console.log(isExpired, createdAt, Date.now())

  if (isExpired) {
    console.log("Payment link expired. Cannot process payment.");
    const error = new Error('Payment link expired. Please try again.');
    error.statusCode = 422;
    return next(error);
  }

  if (data.payment_response && data.payment_response.order_status === "Success") {
    console.log("Payment is already done");
    const error = new Error('Payment is already done.');
    error.statusCode = 422;
    return next(error);
  }

  const payload = {
    merchant_id: merchant_id,
    order_id: data.payment_id,
    currency: "INR",
    billing_name: data.name,
    billing_email: '',
    billing_tel: '',
    amount: data.amount,
    redirect_url: `${baseUrl}/api/admin/payment-response`,
    cancel_url: `${baseUrl}/api/admin/payment-response`,
    language: 'EN'
  };

  console.log('Admin payload ');
  console.log(payload);

  const formDataString = jtfd(payload);

  const encRequest = ccavanue.encrypt(formDataString, workingKey);

  // const formbody = '<form id="nonseamless" method="post" name="redirect" action="' + payment_url + '"/> <input type="hidden" id="encRequest" name="encRequest" value="' + encRequest + '"><input type="hidden" name="access_code" id="access_code" value="' + accessCode + '"><script language="javascript">document.redirect.submit();</script></form>';

  const resObj = {
    payment_url: payment_url,
    encRequest: encRequest,
    accessCode: accessCode
  }

  res.json({
    'data': resObj
  });
};

// ccavanue will  hit this payment response
exports.paymentResponseHandler = async (req, res, next) => {
  const orderNo = req.body.orderNo;
  const encResp = req.body.encResp;

  if (!orderNo) {
    const error = new Error('OrderNo missing from payment_response from ccavanue.');
    error.statusCode = 500;
    return next(error);
  }
  // console.log('Booking ID: ' + orderNo);
  const dataObj = await Payment.findOne({
    "payment_id": orderNo
  });
  // console.log(dataObj);
  if (!dataObj) {
    const error = new Error('Sorry invalid OrderNo, cannot find any transaction with this order no');
    error.statusCode = 500;
    return next(error);
  }

  const paymentData = ccavanue.decrypt(encResp, workingKey);
  const queryStrings = url.parse("/?" + paymentData, true).query;
  //storing payment response
  dataObj.payment_response = queryStrings;
  // console.log(queryStrings)

  // handling form resubmitions
  // check if req is not made for same transaction by checking  dataObj.status
  // if (dataObj.status === 1) {

  // updated payment success code from 1 to 4
  if (dataObj.status === 4) {
    return res.status(422).json({
      'message': 'Payment already done'
    });
  }

  // check if payment is success
  if (queryStrings.order_status === "Success") {

    // dataObj.status = 1; // payment success

    // updated payment success code from 1 to 4
    dataObj.status = 4; // payment success
    dataObj.payment_date = new Date().toISOString();
    await dataObj.save();

    console.log('Payment success');

    const {
      payment_id,
      name,
      amount
    } = dataObj;

    const smsAdmin = `Hello Admin, new payment received. payment_id: ${payment_id}, name: ${name} Amount: ${amount}`;

    try {
      const adminRes = Sms.send("917678105666", smsAdmin);

      Promise.all([adminRes])
        .then((data) => {
          console.log(data);
          console.log("sms sent successfully");
        })
        .catch((err) => {
          throw err;
        })

      // if (guestRes.type != "success") {
      //   throw new Error('Failed to send the sms');
      // }

      // if (adminRes.type != "success") {
      //   throw new Error('Failed to send the sms');
      // }

      // if (admin2Res.type != "success") {
      //   throw new Error('');
      // }

    } catch (err) {
      console.log("Failed to send the sms", err);
    }

    res.redirect(`${clientUrl}/admin/payment-response/${dataObj._id}`);
    // res.json({ 'message': 'success' });
  } else {
    // redirect to failed page
    // dataObj.status = 2;

    // updated payment success code from 2 to 6
    dataObj.status = 6;
    dataObj.save();
    res.json({
      'message': 'failed'
    });
  }
};

exports.allPayments = async (req, res, next) => {
  try {
    // Get pagination parameters
    const paginationParams = getPaginationParams(req, {
      defaultLimit: 20,
      maxLimit: 100
    });

    // Get paginated payments
    const result = await paginateQuery(
      Payment,
      {
        // updated payment success code from 1 to 4
        status: 4
      },
      {
        sort: { created_at: -1 }
      },
      paginationParams
    );

    res.json({
      "status": 200,
      "data": result.data,
      "pagination": result.pagination
    });
  } catch (error) {
    next(error);
  }
}

exports.paymentStatus = async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return res.status(422).json({
      'message': 'Invalid payment id'
    });
  }

  const payment = await Payment.findById(id)

  if (!payment) {
    return res.status(404).json({
      "message": "Payment not found"
    });
  }
  return res.json({
    "status": 200,
    "data": payment
  });
}