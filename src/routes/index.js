const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');
const HotelOffer = require('../models/HotelOffer');
const FlightOffer = require('../models/FlightOffer');
const HolidayOffer = require('../models/HolidayOffer');
const SpecialOffer = require('../models/SpecialOffer');

const {
  dateCompare
} = require('../utils/common');

router.post('/couponCheck', async (req, res, next) => {

  let term = req.body;

  try {
    if (term.code == undefined) {
      throw new Error('Coupon code is required');
    }

    let dataObj = await Coupon.findOne({
      'code': term.code
    });
    if (dataObj == null) {
      throw new Error('Sorry invalid Coupon Code');
    }

    let couponCode = dataObj.toJSON();
    let currentDate = new Date();
    if (dateCompare(currentDate, new Date(couponCode.from), new Date(couponCode.to)) == true) {
      res.json({
        "success": 1,
        "code": couponCode
      })
    } else {
      throw new Error('Sorry is expired on invalid!!!');
    }
  } catch (err) {
    return next(err);
  }

});

router.get('/site/allbanner', async (req, res) => {
  let banners = await Banner.find({});

  // discard expired offers
  banners = banners.filter((banner) => {
    const expireTime = new Date(banner.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": banners
  });
});


router.get('/site/holidaypackage', async (req, res) => {
  let holidayOffers = await HolidayOffer.find({});

  // discard expired offers
  holidayOffers = holidayOffers.filter((holidayOffer) => {
    const expireTime = new Date(holidayOffer.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": holidayOffers
  });
});


router.get('/site/popularhotel', async (req, res) => {
  let hotelOffers = await HotelOffer.find({});

  // discard expired offers
  hotelOffers = hotelOffers.filter((hotelOffer) => {
    const expireTime = new Date(hotelOffer.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": hotelOffers
  });
});

router.get('/site/allspacialoffer', async (req, res) => {
  let specialOffers = await SpecialOffer.find({});

  // discard expired offers
  specialOffers = specialOffers.filter((specialOffer) => {
    const expireTime = new Date(specialOffer.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": specialOffers
  });
});


// ====================================
// ========== updated routes ==========
// ====================================

router.get('/banners', async (req, res) => {
  let banners = await Banner.find({});

  // discard expired offers
  banners = banners.filter((banner) => {
    const expireTime = new Date(banner.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": banners
  });
});


router.get('/packages-holiday', async (req, res) => {
  let holidayOffers = await HolidayOffer.find({});

  // discard expired offers
  holidayOffers = holidayOffers.filter((holidayOffer) => {
    const expireTime = new Date(holidayOffer.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": holidayOffers
  });
});

router.get('/offers-flight', async (req, res) => {
  let flightOffer = await FlightOffer.find({});

  // discard expired offers
  flightOffer = flightOffer.filter((flightOffer) => {
    const expireTime = new Date(flightOffer.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": flightOffer
  });
});

router.get('/offers-hotel', async (req, res) => {
  let hotelOffers = await HotelOffer.find({});

  // discard expired offers
  hotelOffers = hotelOffers.filter((hotelOffer) => {
    const expireTime = new Date(hotelOffer.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": hotelOffers
  });
});

router.get('/offers-special', async (req, res) => {
  let specialOffers = await SpecialOffer.find({});

  // discard expired offers
  specialOffers = specialOffers.filter((specialOffer) => {
    const expireTime = new Date(specialOffer.to).getTime();
    const isExpired = Date.now() > expireTime;
    if (!isExpired) {
      return true;
    }
  });

  res.json({
    "status": 200,
    "data": specialOffers
  });
});

// offers-all api for IOS app's home page
router.get('/offers-all', async (req, res) => {
  let specialOffers;
  try {
    specialOffers = await SpecialOffer.find({});

    // discard expired offers
    specialOffers = specialOffers.filter((specialOffer) => {
      const expireTime = new Date(specialOffer.to).getTime();
      const isExpired = Date.now() > expireTime;
      if (!isExpired) {
        return true;
      }
    });

  } catch (err) {
    specialOffers = [];
    console.log(err);
  }

  let flightOffers;
  try {

    flightOffers = await FlightOffer.find({});

    // discard expired offers
    flightOffers = flightOffers.filter((flightOffer) => {
      const expireTime = new Date(flightOffer.to).getTime();
      const isExpired = Date.now() > expireTime;
      if (!isExpired) {
        return true;
      }
    });
  } catch (err) {
    flightOffers = [];
    console.log(err);
  }

  let hotelOffers;
  try {

    hotelOffers = await HotelOffer.find({});

    // discard expired offers
    hotelOffers = hotelOffers.filter((hotelOffer) => {
      const expireTime = new Date(hotelOffer.to).getTime();
      const isExpired = Date.now() > expireTime;
      if (!isExpired) {
        return true;
      }
    });
  } catch (err) {
    hotelOffers = [];
    console.log(err);
  }

  let holidayOffers;
  try {

    holidayOffers = await HolidayOffer.find({});

    // discard expired offers
    holidayOffers = holidayOffers.filter((holidayOffer) => {
      const expireTime = new Date(holidayOffer.to).getTime();
      const isExpired = Date.now() > expireTime;
      if (!isExpired) {
        return true;
      }
    });
  } catch (err) {
    holidayOffers = [];
    console.log(err);
  }

  let banners;
  try {

    banners = await Banner.find({});

    // discard expired offers
    banners = banners.filter((banner) => {
      const expireTime = new Date(banner.to).getTime();
      const isExpired = Date.now() > expireTime;
      if (!isExpired) {
        return true;
      }
    });
  } catch (err) {
    banners = [];
    console.log(err);
  }

  const allOffers = {
    'specialOffers': specialOffers,
    'flightOffers': flightOffers,
    'hotelOffers': hotelOffers,
    'holidayOffers': holidayOffers,
    'banners': banners
  }

  return res.json({
    "status": 200,
    "data": allOffers
  });
});

module.exports = router;