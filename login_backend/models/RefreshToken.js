const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        refreshToken: {
            type: String,
            required: true
        },
        deviceName: {
            type: String,
            required: true
        },

        userAgent: {
            type: String,
            required: true
        },

        ipAddress: {
            type: String
        },

        expiresAt: {
            type: Date,
            required: true,
            expires: 0
        }
    },
    {
        timestamps: true
    });
module.exports = mongoose.model("RefreshToken", refreshTokenSchema);