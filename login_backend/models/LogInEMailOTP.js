const mongoose = require("mongoose");

const loginOTPSchema = new mongoose.Schema({
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    otp: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    }
});

module.exports = mongoose.model("LoginOTP", loginOTPSchema);