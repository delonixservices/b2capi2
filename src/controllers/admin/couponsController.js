const Coupon = require('../../models/Coupon');
const logger = require('../../config/logger');
const {
  getPaginationParams,
  paginateQuery
} = require('../../utils/pagination');

exports.addCoupon = async (req, res, next) => {

  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const code = req.body.code;
  const value = req.body.value;
  const type = req.body.type;
  const product = req.body.product;

  const coupon = await Coupon.findOne({
    "code": code
  });

  if (coupon) {
    return res.status(422).json({
      "message": "coupon code already exists"
    });
  }

  let newCoupon = new Coupon();

  newCoupon.name = name;
  newCoupon.from = from;
  newCoupon.to = to;
  newCoupon.code = code;
  newCoupon.value = value;
  newCoupon.type = type;
  newCoupon.product = product;

  try {
    await newCoupon.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot add coupon'
    });
  }

  res.json({
    "status": 200,
    "data": newCoupon
  });
};

exports.allCoupons = async (req, res, next) => {
  try {
    // Get pagination parameters
    const paginationParams = getPaginationParams(req, {
      defaultLimit: 20,
      maxLimit: 100
    });

    // Get paginated coupons
    const result = await paginateQuery(
      Coupon,
      {}, // empty query to get all coupons
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
};

exports.editCoupon = async (req, res, next) => {
  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const code = req.body.code;
  const value = req.body.value;
  const type = req.body.type;
  const product = req.body.product;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return res.status(404).json({
      "message": "coupon code does not exists"
    });
  }

  coupon.name = name;
  coupon.from = from;
  coupon.to = to;
  coupon.code = code;
  coupon.value = value;
  coupon.type = type;
  coupon.product = product;

  try {
    await coupon.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot save coupon'
    });
  }

  res.json({
    "status": 200,
    "data": coupon
  });
};

exports.deleteCoupon = async (req, res, next) => {
  const id = req.query.id;
  const coupon = await Coupon.findOneAndDelete({
    "_id": id
  });

  if (coupon) {
    res.json({
      "status": 200,
      "data": coupon
    });
  } else {
    res.status(422).json({
      "message": "Unable to delete coupon code"
    });
  }
};