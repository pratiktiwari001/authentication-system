
const jwt = require("jsonwebtoken")
const setAccessTokenCookie = (res,user)=>{
    const accessToken = jwt.sign( { _id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
    );

    res.cookie("accessToken",accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
})
    
    return accessToken;
}

const setRefreshTokenCookie = (res,user)=>{
    const refreshToken = jwt.sign( { _id: user._id },
        process.env.JWT_SECRET_REFRESH,
        { expiresIn: "7d" }
    );

    res.cookie("refreshToken",refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
})
    
    return refreshToken;
}

module.exports = {setAccessTokenCookie,setRefreshTokenCookie};