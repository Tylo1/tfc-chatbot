const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String, // "user" or "assistant"
        required: true
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);