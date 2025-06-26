/**
 * Pagination utility for MongoDB queries
 */

/**
 * Get pagination parameters from request query
 * @param {Object} req - Express request object
 * @param {Object} options - Pagination options
 * @param {number} options.defaultPage - Default page number (default: 1)
 * @param {number} options.defaultLimit - Default items per page (default: 10)
 * @param {number} options.maxLimit - Maximum items per page (default: 100)
 * @returns {Object} Pagination parameters
 */
const getPaginationParams = (req, options = {}) => {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    maxLimit = 100
  } = options;

  let page = parseInt(req.query.page) || defaultPage;
  let limit = parseInt(req.query.limit) || defaultLimit;

  // Ensure page is at least 1
  page = Math.max(1, page);
  
  // Ensure limit is within bounds
  limit = Math.max(1, Math.min(maxLimit, limit));

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
};

/**
 * Create paginated response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Paginated response object
 */
const createPaginatedResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };
};

/**
 * Execute paginated MongoDB query
 * @param {Object} model - Mongoose model
 * @param {Object} query - MongoDB query object
 * @param {Object} options - Query options
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} Paginated result
 */
const paginateQuery = async (model, query = {}, options = {}, paginationParams) => {
  const { page, limit, skip } = paginationParams;

  // Get total count
  const total = await model.countDocuments(query);

  // Get paginated data
  const data = await model
    .find(query)
    .sort(options.sort || { createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(options.select || {});

  return createPaginatedResponse(data, page, limit, total);
};

/**
 * Execute paginated aggregation pipeline
 * @param {Object} model - Mongoose model
 * @param {Array} pipeline - Aggregation pipeline
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} Paginated result
 */
const paginateAggregation = async (model, pipeline = [], paginationParams) => {
  const { page, limit, skip } = paginationParams;

  // Create count pipeline
  const countPipeline = [
    ...pipeline,
    { $count: 'total' }
  ];

  // Create data pipeline with pagination
  const dataPipeline = [
    ...pipeline,
    { $skip: skip },
    { $limit: limit }
  ];

  // Execute both pipelines
  const [countResult, data] = await Promise.all([
    model.aggregate(countPipeline),
    model.aggregate(dataPipeline)
  ]);

  const total = countResult.length > 0 ? countResult[0].total : 0;

  return createPaginatedResponse(data, page, limit, total);
};

module.exports = {
  getPaginationParams,
  createPaginatedResponse,
  paginateQuery,
  paginateAggregation
}; 