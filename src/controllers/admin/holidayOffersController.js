const HolidayOffer = require('../../models/HolidayOffer');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');

exports.addHolidayOffer = async (req, res, next) => {
  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let holidayOffer = new HolidayOffer();

  holidayOffer.name = name;
  holidayOffer.from = from;
  holidayOffer.to = to;
  holidayOffer.url = url;

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
    holidayOffer.image = filePath;
    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await holidayOffer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot add holiday offer'
    });
  }

  res.json({
    "status": 200,
    data: holidayOffer
  });

};

exports.allHolidayOffers = async (req, res, next) => {
  const holidayOffers = await HolidayOffer.find({}, {
    'updated_at': 0,
    __v: 0
  });

  res.json({
    "status": 200,
    "data": holidayOffers
  });
};

exports.editHolidayOffer = async (req, res, next) => {

  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let holidayOffer = await HolidayOffer.findById(id);

  if (!holidayOffer) {
    return res.status(404).json({
      "message": "holidayOffer does not exists"
    });
  }

  holidayOffer.name = name;
  holidayOffer.from = from;
  holidayOffer.to = to;
  holidayOffer.url = url;

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
    holidayOffer.image = filePath;
    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await holidayOffer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot save holiday offer'
    });
  }

  res.json({
    "status": 200,
    data: holidayOffer
  });
};

exports.deleteHolidayOffer = async (req, res, next) => {
  const id = req.query.id;
  const holidayOffer = await HolidayOffer.findByIdAndDelete(id);
  if (!holidayOffer) {
    return res.status(422).json({
      "message": "Unable to delete holiday offer"
    });
  }

  res.json({
    "status": 200,
    "data": holidayOffer
  });
};