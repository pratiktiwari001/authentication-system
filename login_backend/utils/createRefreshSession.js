const RefreshToken = require("../models/RefreshToken");
const UAParser = require("ua-parser-js");

const createRefreshSession = async (userId, refreshToken, req) => {

    const parser = new UAParser(req.headers["user-agent"]);

    const browser = parser.getBrowser().name || "Unknown Browser";
    const os = parser.getOS().name || "Unknown OS";

    const deviceType = parser.getDevice().type || "Desktop";

    const deviceName = `${browser} on ${os} (${deviceType})`;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
        user: userId,
        refreshToken,
        deviceName,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
        expiresAt
    });
};

module.exports = createRefreshSession;