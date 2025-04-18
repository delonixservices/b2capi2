const Api = require('../../services/apiService');
const FlightTransaction = require('../../models/FlightTransaction');

const jwt = require('jsonwebtoken');
const {
  jwtSecret
} = require('../../config/index');

const User = require('../../models/User');

const {
  createUser
} = require('../../services/userService');

const {
  getStatus
} = require('../../utils/common');

const {
  generateFlightVoucher
} = require('../../utils/voucher');

exports.flightSearch = async (req, res) => {

  const reqBody = req.body;

  console.log(reqBody);

  let data;
  try {
    data = await Api.flights.post('/Api/flightSearch', reqBody);
  } catch (err) {
    console.log(err);
  }

  console.log(data);

  res.json(data);
}

exports.flightPrice = async (req, res, next) => {

  const reqBody = req.body;

  console.log(reqBody);

  let data;
  try {
    data = await Api.flights.post('/Api/priceRequset', reqBody);

    if (!data.DelonixOfferPriceRes || data.Errors) {
      throw new Error("Unable to get flight price.");
    }

    // const transaction = new FlightTransaction();
    // transaction.flight_price_response = data.DelonixOfferPriceRes;

    // await transaction.save();

    // data.transaction_identifier = transaction._id;

  } catch (err) {
    console.log(err);
    return next(err);
  }

  console.log(data);

  res.json(data);
}

exports.processOrder = async (req, res, next) => {

  const reqBody = req.body;

  console.log(reqBody);

  // const transactionIdentifier = req.body.transactionIdentifier;

  // if (!transactionIdentifier) {
  //   return res.status(400).json({
  //     'message': 'transactionIdentifier must be sent in the request body'
  //   });
  // }

  const userObj = {
    'name': reqBody.travelers[0].name,
    'last_name': reqBody.travelers[0].surname,
    'mobile': reqBody.contactContactInformation[0].phone.phone,
    'email': reqBody.contactContactInformation[0].email.email
  }

  let userId;
  let isAuth = false;

  // check is user is authenticated
  const authHeader = req.get('Authorization');

  // console.log(authHeader);
  if (authHeader) {
    // Get token string after Bearer
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      console.log(err);
    }
    if (decodedToken) {
      isAuth = true;
      userId = decodedToken.userId;
    }
  }

  // Handle anonemous user
  if (!isAuth) {
    // check if user with this mobile no. already exists
    const user = await User.findOne({
      "mobile": userObj.mobile
    });

    // If user does not exists, create new user
    if (!user) {
      const newUser = await createUser(userObj);
      userId = newUser._id;
    } else {
      // @TODO If user exists with provided mobile no
      userId = user._id;
    }
  }

  const transaction = new FlightTransaction();
  transaction.search = reqBody;
  transaction.status = 0;
  await transaction.save();

  // createOrder api
  // @FIXME: Currently generating PNR and eticket is done with single api, i.e. createOrder.
  // make changes accordingly when delonix b2b implementation is changed

  let data;
  try {
    data = await Api.flights.post('/Api/createOrder', transaction.search);

    console.log('Create order executed...');
    console.log(data);

    if (!data || !data.OrderViewRS) {
      throw new Error("Unable to create order. No response received from supplier");
    }

    if (!data.OrderViewRS.Response) {
      throw new Error(data.OrderViewRS.Errors.ErrorMessage);
    }

    transaction.userId = userId;
    transaction.order_create_response = data.OrderViewRS;
    transaction.status = 8; // booking hold

  } catch (err) {
    console.log(err);
    await transaction.save();
    return next(err);
  }

  console.log(transaction);

  data._id = transaction._id;

  console.log(data);

  res.json({
    'bookingId': transaction._id
  });

  await transaction.save();
}

exports.orderRetrieve = async (req, res) => {

  const reqBody = req.body;

  console.log(reqBody);

  let data;
  try {
    data = await Api.flights.post('/Api/orderRetrive', reqBody);
  } catch (err) {
    console.log(err);
  }

  console.log(data);

  res.json(data);
}

exports.cancelOrder = async (req, res) => {
  const reqBody = req.body;

  console.log(reqBody);

  let data;
  try {
    data = await Api.flights.post('/Api/cancelOrder', reqBody);
  } catch (err) {
    console.log(err);
  }

  console.log(data);

  res.json(data);
}

exports.getTransactions = async (req, res) => {
  const userId = req.body.userId;
  console.log(userId, req.user._id);
  if (userId !== req.user._id) {
    return res.status(403).json({
      "message": "Not Authorized"
    });
  }

  const data = await FlightTransaction.find({
      $and: [{
          "userId": {
            $exists: true
          }
        },
        {
          "userId": req.user._id
        }
      ]
    })
    .sort("-created_at")

  console.log(data);

  res.json({
    "status": 200,
    "data": data
  });
}

exports.transactionStatus = async (req, res) => {
  const transactionId = req.body.transactionId;
  console.log(transactionId);

  if (!transactionId) {
    return res.status(400).json({
      'message': 'Invalid transaction Id.'
    });
  }

  try {
    const transaction = await FlightTransaction.findById(transactionId);
    console.log(transaction);

    if (!transaction) {
      throw new Error('Transaction not found.');
    }

    const status = getStatus(transaction.status);
    console.log(status);

    return res.json({
      'status': status
    });

  } catch (err) {
    console.log(err);
    res.status(404).json({
      'message': err.message
    });
  }
}

exports.getTransaction = async (req, res) => {
  const transactionId = req.params.id;
  console.log(transactionId);

  if (!transactionId) {
    return res.status(400).json({
      'message': 'Invalid transaction Id.'
    });
  }

  try {
    const transaction = await FlightTransaction.findById(transactionId);
    console.log(transaction);

    if (!transaction) {
      throw new Error('Transaction not found.');
    }

    return res.json(transaction);

  } catch (err) {
    console.log(err);
    res.status(404).json({
      'message': err.message
    });
  }
}

exports.voucher = async (req, res, _next) => {
  const transactionId = req.query.transactionId;
  console.log(transactionId);

  if (!transactionId) {
    return res.status(422).json({
      'message': 'Cannot get voucher for the given transaction'
    });
  }

  const transaction = await FlightTransaction.findById(transactionId);

  if (!transaction) {
    return res.status(500).send('Invalid booking id');
  }

  // @FIXME: isAuth not applied

  // if (transaction.userId != req.user._id) {
  //   return res.status(403).send('Not Authorized!');
  // }

  if (transaction.status != 1) {
    return res.status(422).send('Cannot get voucher for incomplete transaction');
  }

  let buffer;
  try {
    buffer = await generateFlightVoucher(transaction);
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