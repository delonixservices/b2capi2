const FlightOffer = require('../../models/FlightOffer');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');

exports.addFlightOffer = async (req, res, next) => {

  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let flightOffer = new FlightOffer();

  flightOffer.name = name;
  flightOffer.from = from;
  flightOffer.to = to;
  flightOffer.url = url;

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
    flightOffer.image = filePath;
    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await flightOffer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot add flightOffer'
    });
  }

  res.json({
    "status": 200,
    data: flightOffer
  });

};

exports.allFlightOffers = async (req, res, next) => {
  const flightOffers = await FlightOffer.find({}, {
    'updated_at': 0,
    __v: 0
  });

  res.json({
    "status": 200,
    "data": flightOffers
  });
};

exports.editFlightOffer = async (req, res, next) => {
  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let flightOffer = await FlightOffer.findById(id);

  if (!flightOffer) {
    return res.status(404).json({
      "message": "flightOffer does not exists"
    });
  }

  flightOffer.name = name;
  flightOffer.from = from;
  flightOffer.to = to;
  flightOffer.url = url;

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
    flightOffer.image = filePath;
    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await flightOffer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot save flightOffer'
    });
  }

  res.json({
    "status": 200,
    data: flightOffer
  });
};

exports.deleteFlightOffer = async (req, res, next) => {
  const id = req.query.id;
  const flightOffer = await FlightOffer.findByIdAndDelete(id);
  if (!flightOffer) {
    return res.status(422).json({
      "message": "Unable to delete flight offer"
    });
  }

  res.json({
    "status": 200,
    "data": flightOffer
  });

};