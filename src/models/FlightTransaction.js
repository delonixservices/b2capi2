const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
  },
  search: {
    type: Object
  },
  coupon: {
    type: Object
  },
  status: {
    type: Object
  },
  order_create_response: {
    type: Object
  },
  payment_response: {
    type: Object
  },
  order_retrieve_response: {
    type: Object
  },
  order_doc_issue_response: {
    type: Object
  },
  cancel_response: {
    type: Object
  },
  refund_response: {
    type: Object
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('FlightTransaction', TransactionSchema, 'flightTransactions');