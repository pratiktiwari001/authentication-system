const RefreshToken = require("../models/RefreshToken");

const logout = async(req, res)=>{
    const {refreshToken} = req.cookies
    await RefreshToken.deleteOne({
        refreshToken
    })
    res.cookie("accessToken",null,{expires: new Date(Date.now())});
    res.cookie("refreshToken",null,{expires: new Date(Date.now())});
    res.status(200).send("LOGOUT Successful");
}

const logoutAll = async(req,res)=>{
    const user = req.user;

    await RefreshToken.deleteMany({
        user: user._id
    })
    res.cookie("accessToken",null,{expires: new Date(Date.now())});
    res.cookie("refreshToken",null,{expires: new Date(Date.now())});
    res.status(200).send("LOGOUT Successful from all devices");
}

module.exports = {logout, logoutAll};