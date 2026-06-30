const mongoose = require('mongoose');

// Defines what a menu item looks like in the database
const menuItemSchema = new mongoose.Schema({
    //These are all objects, which I said were gonna be important for the project in my demo video
    category: {
        type: String,       
        required: true      
    },

    name: {
        type: String,       
        required: true      
    },

    price: {
        type: Number,       
        required: true      
    },

    available: {
        type: Boolean,      
        default: true       
    },

    isBestSeller: {
        type: Boolean,      
        default: false      
    },

    alternativeTo: {
        type: String,       
        default: null       
    }

});

// Export
module.exports = mongoose.model('MenuItem', menuItemSchema);