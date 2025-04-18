const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelOfferSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
    },
    from: {
        type: Date,
        required: true
    },
    to: {
        type: Date,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    image: {
        type: String
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('HotelOffer', hotelOfferSchema, 'hotelOffers');