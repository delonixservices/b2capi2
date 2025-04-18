const History = require('../../models/History');

exports.apiHistory = async (req, res, next) => {
  const history = await History.find({});

  return res.json({
    'data': history
  });
}