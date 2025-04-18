const History = require('../models/History');
const logger = require('../config/logger');

module.exports = (req, res, next) => {
  try {

    let oldWrite = res.write,
      oldEnd = res.end;

    let chunks = [];

    const startTime = new Date().getTime();

    res.write = function (chunk) {
      // fix: when using res.redirect
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }

      oldWrite.apply(res, arguments);
    };

    res.end = async function (chunk) {
      // fix: when using res.redirect    
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }
      // console.log(chunk, typeof (chunk));

      let body = Buffer.concat(chunks).toString('utf8');

      const originalUrl = req.originalUrl;
      // save req and res of all routes starting with /api except  /api/admin
      // don't save admin api history
      if (originalUrl.indexOf('/api') >= 0 && originalUrl.indexOf('/admin') < 0) {

        const responseTime = new Date().getTime() - startTime + 10;

        console.log(`responseTime ${responseTime} ms`);
        console.log(req.ip, req.ips)

        let respBody;
        try {
          respBody = JSON.parse(body)
        } catch (err) {
          respBody = body;
        }

        const apiHistory = new History({
          'request': {
            'body': req.body,
            'method': req.method,
            'remoteAddress': req._remoteAddress,
            'ip': req.ip,
            'startTime': req._startTime
          },
          'response': {
            'body': respBody,
            'statusCode': res.statusCode,
            'responseTime': responseTime
          },
          'url': originalUrl,
          'date': new Date().toISOString()
        });

        try {
          await apiHistory.save();
        } catch (err) {
          logger.error(`Mongo error: ${err.message}`);
        }
      }

      oldEnd.apply(res, arguments);
    };

  } catch (err) {
    logger.error(err.message);
  }

  next();
}