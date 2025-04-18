const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
  request: {
    method: {
      type: String
    },
    body: {
      type: Object,
      required: true
    },
    remoteAddress: {
      type: String,
    },
    startTime: {
      type: Date,
    }
  },
  response: {
    body: {
      type: Object,
      required: true
    },
    statusCode: {
      type: String
    },
    responseTime: {
      type: Number
    },
  },
  date: {
    type: Date,
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('History', historySchema, 'history');