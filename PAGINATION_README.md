# Pagination System Documentation

This document explains how to use the pagination system implemented in the B2C API.

## Overview

The pagination system provides a consistent way to handle paginated data across all API endpoints. It includes:

1. **Pagination Utility** (`src/utils/pagination.js`) - Core pagination functions
2. **Pagination Middleware** (`src/middleware/pagination.js`) - Express middleware for easy integration
3. **Updated Controllers** - Controllers that now support pagination

## Features

- ✅ Query parameter validation
- ✅ Configurable page size limits
- ✅ Consistent response format
- ✅ Support for both simple queries and aggregation pipelines
- ✅ Error handling
- ✅ Middleware for easy integration

## Usage

### 1. Using the Pagination Utility Directly

```javascript
const { getPaginationParams, paginateQuery } = require('../utils/pagination');

exports.getAllItems = async (req, res, next) => {
  try {
    // Get pagination parameters from request
    const paginationParams = getPaginationParams(req, {
      defaultLimit: 20,
      maxLimit: 100
    });

    // Execute paginated query
    const result = await paginateQuery(
      YourModel,
      { /* your query */ },
      {
        sort: { createdAt: -1 },
        select: { field1: 1, field2: 1 }
      },
      paginationParams
    );

    res.json({
      status: 200,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};
```

### 2. Using Pagination Middleware

```javascript
const { defaultPagination } = require('../middleware/pagination');

// In your routes file
router.get('/items', defaultPagination, yourController.getAllItems);

// In your controller
exports.getAllItems = async (req, res, next) => {
  try {
    // Pagination parameters are already available in req.pagination
    const result = await paginateQuery(
      YourModel,
      {},
      { sort: { createdAt: -1 } },
      req.pagination
    );

    res.json({
      status: 200,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};
```

### 3. Using Aggregation Pipeline

```javascript
const { paginateAggregation } = require('../utils/pagination');

exports.getComplexData = async (req, res, next) => {
  try {
    const paginationParams = getPaginationParams(req);
    
    const pipeline = [
      { $match: { status: 'active' } },
      { $lookup: { /* your lookup */ } },
      { $unwind: '$relatedData' }
    ];

    const result = await paginateAggregation(
      YourModel,
      pipeline,
      paginationParams
    );

    res.json({
      status: 200,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};
```

## API Parameters

### Query Parameters

- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

### Example Request

```
GET /api/admin/transactions?page=2&limit=25
```

## Response Format

```json
{
  "status": 200,
  "data": [
    // Your data items here
  ],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 150,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": true,
    "nextPage": 3,
    "prevPage": 1
  }
}
```

## Available Middleware

### 1. `defaultPagination`
- Default page: 1
- Default limit: 20
- Max limit: 100

### 2. `largePagination`
- Default page: 1
- Default limit: 50
- Max limit: 200

### 3. `smallPagination`
- Default page: 1
- Default limit: 10
- Max limit: 50

### 4. `paginationMiddleware(options)`
Custom middleware with your own settings:

```javascript
const customPagination = paginationMiddleware({
  defaultPage: 1,
  defaultLimit: 15,
  maxLimit: 75
});
```

## Updated Controllers

The following controllers have been updated to support pagination:

1. **Transactions Controller** (`src/controllers/admin/transactionsController.js`)
   - `allTransactions` - Now supports pagination

2. **Users Controller** (`src/controllers/admin/usersController.js`)
   - `allUsers` - Now supports pagination

3. **History Controller** (`src/controllers/admin/historyController.js`)
   - `apiHistory` - Now supports pagination

4. **Coupons Controller** (`src/controllers/admin/couponsController.js`)
   - `allCoupons` - Now supports pagination

5. **Banners Controller** (`src/controllers/admin/bannersController.js`)
   - `allBanners` - Now supports pagination

6. **Payment Controller** (`src/controllers/admin/paymentController.js`)
   - `allPayments` - Now supports pagination

## Utility Functions

### `getPaginationParams(req, options)`
Extracts and validates pagination parameters from request query.

**Parameters:**
- `req`: Express request object
- `options`: Configuration object
  - `defaultPage`: Default page number (default: 1)
  - `defaultLimit`: Default items per page (default: 10)
  - `maxLimit`: Maximum items per page (default: 100)

**Returns:**
```javascript
{
  page: 1,
  limit: 20,
  skip: 0
}
```

### `createPaginatedResponse(data, page, limit, total)`
Creates a standardized paginated response object.

**Parameters:**
- `data`: Array of items
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of items

**Returns:**
```javascript
{
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
    hasNextPage: true,
    hasPrevPage: false,
    nextPage: 2,
    prevPage: null
  }
}
```

### `paginateQuery(model, query, options, paginationParams)`
Executes a paginated MongoDB query.

**Parameters:**
- `model`: Mongoose model
- `query`: MongoDB query object
- `options`: Query options (sort, select, etc.)
- `paginationParams`: Pagination parameters

### `paginateAggregation(model, pipeline, paginationParams)`
Executes a paginated MongoDB aggregation pipeline.

**Parameters:**
- `model`: Mongoose model
- `pipeline`: Aggregation pipeline array
- `paginationParams`: Pagination parameters

## Error Handling

The pagination system includes built-in error handling:

- Invalid page numbers are automatically corrected to 1
- Invalid limits are clamped to the configured min/max values
- Database errors are properly caught and passed to error middleware

## Best Practices

1. **Use appropriate limits**: Choose reasonable default and maximum limits based on your data size and performance requirements.

2. **Consistent sorting**: Always specify a sort order to ensure consistent pagination results.

3. **Index optimization**: Ensure your database has proper indexes for the fields you're sorting and filtering on.

4. **Error handling**: Always wrap pagination calls in try-catch blocks.

5. **Response consistency**: Use the standard response format for all paginated endpoints.

## Example Implementation

Here's a complete example of implementing pagination in a new controller:

```javascript
const { getPaginationParams, paginateQuery } = require('../../utils/pagination');
const YourModel = require('../../models/YourModel');

exports.getAllItems = async (req, res, next) => {
  try {
    // Get pagination parameters
    const paginationParams = getPaginationParams(req, {
      defaultLimit: 20,
      maxLimit: 100
    });

    // Build query based on filters
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Execute paginated query
    const result = await paginateQuery(
      YourModel,
      query,
      {
        sort: { createdAt: -1 },
        select: { 
          _id: 1, 
          name: 1, 
          status: 1, 
          createdAt: 1 
        }
      },
      paginationParams
    );

    // Return response
    res.json({
      status: 200,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};
```

## Migration Guide

To add pagination to existing endpoints:

1. Import the pagination utilities
2. Replace direct model queries with `paginateQuery` or `paginateAggregation`
3. Update the response format to include pagination metadata
4. Add appropriate error handling
5. Test with different page and limit parameters

## Testing

Test your paginated endpoints with various parameters:

```
GET /api/endpoint?page=1&limit=10
GET /api/endpoint?page=2&limit=25
GET /api/endpoint?page=999&limit=1000  // Should be clamped
GET /api/endpoint?page=0&limit=-5      // Should be corrected
GET /api/endpoint                      // Should use defaults
``` 