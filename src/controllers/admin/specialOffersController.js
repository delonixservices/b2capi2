const SpecialOffer = require('../../models/SpecialOffer');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');

exports.AddSpecialOffer = async (req, res, next) => {
  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let offer = new SpecialOffer();

  offer.name = name;
  offer.from = from;
  offer.to = to;
  offer.url = url;

  // const image = req.file('image', {
  //     maxSize: '2mb',
  //     allowedExtensions: ['jpg', 'png', 'jpeg']
  // }
  const image = req.file;

  if (id == "" && !image) {
    // throw BadRequestException.invoke(`Image required`);
  }

  if (image) {
    const uuid = uuidv1().replace(/-/g, '');
    const fileName = `${uuid}_${image.fieldname}`;
    // await image.move(use('Helpers').publicPath('uploads'), {
    //     name: fileName
    // });
    let extension = path.extname(image.originalname);
    extension = extension ? extension : '.jpg';

    const filePath = `uploads/${fileName}${extension}`;
    offer.image = filePath;
    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await offer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot add offer'
    });
  }

  // const offers = await SpecialOffer.all();
  res.json({
    "status": 200,
    data: offer
  });

};

exports.allSpecialOffers = async (req, res, next) => {
  const offers = await SpecialOffer.find({}, {
    'updated_at': 0,
    __v: 0
  });

  res.json({
    "status": 200,
    "data": offers
  });
};

exports.editSpecialOffer = async (req, res, next) => {

  const id = req.body._id;
  const name = req.body.name;
  const from = req.body.from;
  const to = req.body.to;
  const url = req.body.url;

  let offer = await SpecialOffer.findById(id);

  if (!offer) {
    return res.status(404).json({
      "message": "offer does not exists"
    });
  }

  offer.name = name;
  offer.from = from;
  offer.to = to;
  offer.url = url;

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

    offer.image = filePath;

    const fullPath = path.join(__dirname, `/../../../public/${filePath}`);

    fs.writeFile(fullPath, image.buffer, (err) => {
      console.log(err);
    });
  }

  try {
    await offer.save();
  } catch (err) {
    logger.error(`Mongodb error: ${err.message}`);
    return res.status(500).json({
      'message': 'Cannot save offer'
    });
  }

  res.json({
    "status": 200,
    data: offer
  });
};

exports.deleteSpecialOffer = async (req, res, next) => {
  const id = req.query.id;
  const offer = await SpecialOffer.findByIdAndDelete(id);
  if (!offer) {
    return res.status(422).json({
      "message": "Unable to delete specialOffer"
    });
  }

  res.json({
    "status": 200,
    "data": offer
  });
};