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

        expiresAt: {
            type: Date,
            required: true,
            expires: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);