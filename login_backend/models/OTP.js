const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    emailOTP: {
        type: String,
        required: true
    },

    phoneOTP: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0     //Time To Leave Index
    }

});

module.exports = mongoose.model("OTP", otpSchema);