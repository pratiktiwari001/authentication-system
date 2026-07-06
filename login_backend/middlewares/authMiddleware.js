const jwt = require("jsonwebtoken");
const User = require("../models/Users");

const authMiddleware = async(req,res,next)=>{
    const accessToken = req.cookies.accessToken;
    // console.log(accessToken);
    if(!accessToken){
        return res.status(401).json({
            message: "Unauthorized access: Please Login!"
        })
    }
    // console.log(accessToken)

    try{
    const decoded= await jwt.verify(accessToken, process.env.JWT_SECRET);
    const { _id } = decoded;
    // console.log(decoded)
    // console.log(_id);
        const user = await User.findById(_id).select('-password');;
        if (!user) {
            throw new Error("User not found")
        }
    req.user = user;
    next();
    }
    catch(error){
        return res.status(401).send(
        "Session Expired");
    }
}

module.exports = authMiddleware;