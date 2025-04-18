const MetaSearch = require('../../models/MetaSearch');
const shortid = require('shortid');
const Transactions = require('../../models/HotelTransaction');

exports.addVendor = async (req, res, next) => {
  try {

    const vendorName = req.body.name;

    let referenceId;
    try {
      shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
      referenceId = shortid.generate();
    } catch (err) {
      throw new Error(err.message);
    }

    console.log(referenceId);

    const metaSearch = new MetaSearch({
      'vendor': {
        'name': vendorName,
        'referenceId': referenceId
      }
    });

    await metaSearch.save();

    res.json({
      'data': metaSearch
    });
  } catch (err) {
    return res.status(500).json({
      'message': `Error in generating response, Error: ${err.message}`
    });
  }
}

exports.getAllVendors = async (req, res, next) => {
  const metaSearch = await MetaSearch.find({});

  res.json({
    'data': metaSearch
  });
}

exports.editVendor = async (req, res, next) => {

}

exports.disableVendor = async (req, res, next) => {

}

exports.getAllVendorTransactions = async (req, res, next) => {
  try {
    const id = req.params.id;

    console.log(id);

    // const metaSearch = await MetaSearch.findById(id);

    // console.log(metaSearch);

    // const referenceId = metaSearch.vendor.referenceId;

    const data = await Transactions.find({
      'hotel.meta_search_referenceId': id
    });

    console.log(data);

    const getStatus = ["pending", "success", "cancelled", "payment_pending", "payment_success", "booking_failed", "payment_failed", ];

    const allTransactions = [];

    data.forEach((trans) => {
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
      "data": allTransactions
    });

  } catch (err) {
    return res.status(500).json({
      'message': `Error in generating response, Error: ${err.message}`
    });
  }
}