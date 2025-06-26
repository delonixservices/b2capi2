const History = require('../../models/History');
const {
  getPaginationParams,
  paginateQuery
} = require('../../utils/pagination');

exports.apiHistory = async (req, res, next) => {
  try {
    // Get pagination parameters
    const paginationParams = getPaginationParams(req, {
      defaultLimit: 50,
      maxLimit: 200
    });

    // Get paginated history
    const result = await paginateQuery(
      History,
      {}, // empty query to get all history
      {
        sort: { date: -1 }
      },
      paginationParams
    );

    return res.json({
      'data': result.data,
      'pagination': result.pagination
    });
  } catch (error) {
    next(error);
  }
}