const RefreshToken = require("../models/RefreshToken")
const getSessions = async (req, res) => {
    try {
        const allSessions = await RefreshToken.find({
            user: req.user._id
        })

        const currentRefreshToken = req.cookies.refreshToken;

        const sessions = allSessions.map((session) => ({
            _id: session._id,
            deviceName: session.deviceName,
            ipAddress: session.ipAddress,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            isCurrentDevice:
                session.refreshToken === currentRefreshToken
        }));

        return res.status(200).json({
            totalDevices: sessions.length,
            sessions
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
module.exports = getSessions;