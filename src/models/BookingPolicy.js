const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingPolicySchema = new Schema({
    booking_policy: {
        type: Object,
        required: true
    },
    search: {
        type: Object,
        required: true
    },
    transaction_identifier: {
        type: String,
        required: true
    },
    hotel: {
        type: Schema.Types.ObjectId,
        ref: 'Hotel'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('BookingPolicy', bookingPolicySchema, 'bookingPolicy');