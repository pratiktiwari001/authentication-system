const RefreshToken = require("../models/RefreshToken");

const createRefreshSession = async (userId, refreshToken) => {

    await RefreshToken.create({
        user: userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

};

module.exports = createRefreshSession;