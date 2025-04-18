const express = require('express');
const moment = require('moment-timezone');
const morgan = require('morgan');
const logger = require('../config/logger');
const cors = require('cors');
const path = require('path');

const apiHistory = require('../middleware/apiHistory');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../swagger.json');


const expressLoader = async (app) => {

  app.use(express.static(path.join(__dirname, "/../../public")));

  app.use(express.urlencoded({
    extended: true,
    limit: "5mb"
  }));

  app.use(express.json({
    limit: "5mb"
  }));

  const indexRoute = require('../routes/index');
  const authRoute = require('../routes/auth');
  const hotelsRoute = require('../routes/hotels');
  const flightsRoute = require('../routes/flights');
  const adminRoute = require('../routes/admin');

  // allow cross origin requests
  app.use(cors());

  // Express will have knowledge that it's sitting behind a proxy and that the X-Forwarded-* 
  // header fields may be trusted, which otherwise may be easily spoofed.
  app.set('trust proxy', true);

  morgan.token('date', (req, res, tz) => {
    return moment().tz(tz).format();
  });
  morgan.format('myformat', '[:date[Asia/Kolkata]] ":method :url" :status :res[content-length] - :response-time ms');

  app.use(morgan('myformat', {
    stream: logger.stream
  }));

  // save req res in db
  app.use(apiHistory);

  app.get('/', (req, res) => {
    return res.send('Welcome to the TripBazaar api server');
  });

  app.use('/api', indexRoute);
  app.use('/api/auth', authRoute);
  app.use('/api/hotels', hotelsRoute);
  app.use('/api/flights', flightsRoute);
  app.use('/api/admin', adminRoute);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('*', (req, res, next) => {
    logger.info('Route not found...');
    res.status(404).json({
      'message': 'Route not found'
    });
  });

  // error-handling functions will always have four arguments instead of three: (err, req, res, next)
  app.use((error, req, res, next) => {
    // console.log(`Express ${error}`);
    logger.error(error.message, {
      url: req.originalUrl
    });
    const statusCode = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    return res.status(statusCode).json({
      message: message,
      data: data
    });
  });

  process.on('unhandledRejection', (error, promise) => {
    console.log("\x1b[31m%s\x1b[0m", `Forgot to handle a promise rejection: ${promise}`);
    console.log('The error was: ', error);
    logger.error(`${error}`);
  });
}

module.exports = expressLoader;