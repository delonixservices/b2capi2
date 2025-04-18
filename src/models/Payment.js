const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  'name': {
    type: String,
    required: true
  },
  'amount': {
    type: Number,
    required: true
  },
  'payment_id': {
    type: String
  },
  'status': {
    type: Number
  },
  // 'expiry': {
  //   type: Date,
  //   required: true
  // },
  'payment_date': {
    type: Date
  },
  'payment_response': {
    type: Object
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Payment', paymentSchema, 'payments');