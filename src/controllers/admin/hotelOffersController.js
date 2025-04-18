const HotelOffer = require('../../models/HotelOffer');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');

exports.addHotelOffer = async (req, res, next) => {

  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let hotelOffer = new HotelOffer();

  hotelOffer.name = name;
  hotelOffer.from = from;
  hotelOffer.to = to;
  hotelOffer.url = url;

  const image = req.file;

  if (id == "" && !image) {
    // throw BadRequestException.invoke(`Image required`);
  }

  if (image) {
    const uuid = uuidv1().replace(/-/g, '');
    const fileName = `${uuid}_${image.fieldname}`;

    let extension = path.extname(image.originalname);
    extension = extension ? extension : '.jpg';

    const filePath = `uploads/${fileName}${extension}`;
    hotelOffer.image = filePath;
    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await hotelOffer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot save hotel offer'
    });
  }

  res.json({
    "status": 200,
    data: hotelOffer
  });

};

exports.allHotelOffers = async (req, res, next) => {
  const hotelOffers = await HotelOffer.find({}, {
    'updated_at': 0,
    __v: 0
  });

  res.json({
    "status": 200,
    "data": hotelOffers
  });
};

exports.editHotelOffer = async (req, res, next) => {

  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let hotelOffer = await HotelOffer.findById(id);

  if (!hotelOffer) {
    return res.status(404).json({
      "message": "hotelOffer does not exists"
    });
  }

  hotelOffer.name = name;
  hotelOffer.from = from;
  hotelOffer.to = to;
  hotelOffer.url = url;

  const image = req.file;

  if (id == "" && !image) {
    // throw BadRequestException.invoke(`Image required`);
  }

  if (image) {
    const uuid = uuidv1().replace(/-/g, '');
    const fileName = `${uuid}_${image.fieldname}`;

    let extension = path.extname(image.originalname);
    extension = extension ? extension : '.jpg';

    const filePath = `uploads/${fileName}${extension}`;
    hotelOffer.image = filePath;
    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await hotelOffer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot save hotel offer'
    });
  }

  res.json({
    "status": 200,
    data: hotelOffer
  });
};

exports.deleteHotelOffer = async (req, res, next) => {
  const id = req.query.id;
  const hotelOffer = await HotelOffer.findByIdAndDelete(id);
  if (!hotelOffer) {
    return res.status(422).json({
      "message": "Unable to delete hotel offer"
    });
  }

  res.json({
    "status": 200,
    "data": hotelOffer
  });

};