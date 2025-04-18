const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelSchema = new Schema({
  "hotelId": {
    type: String
  },
  "hotel_response_id": {
    type: String
  },
  "originalName": {
    type: String,
    required: true
  },
  "moreRatings": {
    type: Object,
    // required: true
  },
  "amenities": {
    type: Array,
    required: true
  },
  "moreDetails": {
    type: Object,
    required: true
  },
  "imageDetails": {
    type: Object,
    required: true
  },
  "rates": {
    type: Object,
    // required: true
  },
  "name": {
    type: String,
    required: true
  },
  "location": {
    type: Object,
    required: true
  },
  "id": {
    type: String,
    required: true
  },
  "starRating": {
    type: Object,
    // required: true
  },
  "dailyRates": {
    type: Object,
    // required: true
  },
  "policy": {
    // type: Object,
    // required: true
  },
  "meta_search_referenceId": {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Hotel', hotelSchema, 'hotels');