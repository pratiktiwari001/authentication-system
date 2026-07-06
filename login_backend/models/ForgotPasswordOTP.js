const mongoose = require("mongoose")

const ForgotPasswordOTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },

    otp: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    },
    isOTPVerified: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("ForgotPasswordOTP",ForgotPasswordOTPSchema)