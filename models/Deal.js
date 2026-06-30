const mongoose = require('mongoose');
// defining a deal in database
const dealSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },
    
    isBestSeller: {
        type: Boolean,
        default: false
    },

    items: {
        type: [String],
        required: true
    }

});
// Export code
module.exports = mongoose.model('Deal', dealSchema);