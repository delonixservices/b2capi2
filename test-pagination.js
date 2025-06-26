/**
 * Test script to demonstrate pagination functionality
 * Run this with: node test-pagination.js
 */

const { getPaginationParams, createPaginatedResponse } = require('./src/utils/pagination');

// Mock request objects for testing
const mockRequests = [
  // Basic request with no pagination params
  { query: {} },
  
  // Request with page parameter
  { query: { page: '2' } },
  
  // Request with limit parameter
  { query: { limit: '25' } },
  
  // Request with both page and limit
  { query: { page: '3', limit: '50' } },
  
  // Request with invalid parameters (should be corrected)
  { query: { page: '0', limit: '-5' } },
  
  // Request with very large parameters (should be clamped)
  { query: { page: '999', limit: '1000' } }
];

console.log('=== Pagination Utility Test ===\n');

// Test getPaginationParams function
console.log('1. Testing getPaginationParams function:');
console.log('=====================================');

mockRequests.forEach((req, index) => {
  console.log(`\nTest ${index + 1}: ${JSON.stringify(req.query)}`);
  
  try {
    const params = getPaginationParams(req, {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100
    });
    
    console.log('Result:', params);
  } catch (error) {
    console.log('Error:', error.message);
  }
});

// Test createPaginatedResponse function
console.log('\n\n2. Testing createPaginatedResponse function:');
console.log('===========================================');

const mockData = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
  { id: 4, name: 'Item 4' },
  { id: 5, name: 'Item 5' }
];

const testCases = [
  { page: 1, limit: 10, total: 25 },
  { page: 2, limit: 5, total: 25 },
  { page: 3, limit: 10, total: 25 },
  { page: 1, limit: 20, total: 15 }
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: page=${testCase.page}, limit=${testCase.limit}, total=${testCase.total}`);
  
  const response = createPaginatedResponse(mockData, testCase.page, testCase.limit, testCase.total);
  
  console.log('Response:');
  console.log(JSON.stringify(response, null, 2));
});

// Test error handling
console.log('\n\n3. Testing error handling:');
console.log('==========================');

const errorTestCases = [
  { query: { page: 'abc' } },
  { query: { limit: 'xyz' } },
  { query: { page: 'abc', limit: 'xyz' } }
];

errorTestCases.forEach((req, index) => {
  console.log(`\nError Test ${index + 1}: ${JSON.stringify(req.query)}`);
  
  try {
    const params = getPaginationParams(req);
    console.log('Result (should use defaults):', params);
  } catch (error) {
    console.log('Error:', error.message);
  }
});

console.log('\n\n=== Test Complete ===');
console.log('\nTo test with actual API endpoints:');
console.log('GET /api/admin/transactions?page=1&limit=20');
console.log('GET /api/admin/users?page=2&limit=10');
console.log('GET /api/admin/coupons?page=1&limit=15'); 