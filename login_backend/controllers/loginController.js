const User = require("../models/Users");
const OTP = require("../models/OTP");
const LoginOTP = require("../models/LogInEMailOTP")
const bcrypt = require("bcrypt");
const sendEmailOTP = require("../services/emailService")
const sendSMSOTP = require("../services/smsService");
const generateOTP = require("../utils/generateOTP");
// const { jwt } = require("twilio");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const {setAccessTokenCookie,setRefreshTokenCookie} = require("../utils/generateToken");
const createRefreshSession = require("../utils/createRefreshSession")

const logIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(403).json({
                message: "User not registered yet!!"
            })
        }
        const isCorrect = await bcrypt.compare(password, userData.password);
        // console.log(isCorrect);
        if (userData.email !== email || !isCorrect) {
            return res.status(401).json({
                message: "Unauthorized Access"
            })
        }

        // generateToken(res, userData);
        setAccessTokenCookie(res, userData);
        const refreshToken = setRefreshTokenCookie(res, userData);
        await createRefreshSession(userData._id, refreshToken);
        // console.log(utoken)
        return res.status(200).json({
            message: "Logged In Successfully!!"
        })
        
    }

    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

const sendLogInOTPEmail = async (req,res)=>{
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found. Please register first."
            });
        }

        const otp = generateOTP();

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const emailExists = await LoginOTP.findOne({ email });

        if (emailExists) {

            emailExists.otp = otp;
            emailExists.expiresAt = expiresAt;

            await emailExists.save();

        } else {

            await LoginOTP.create({
                email,
                otp,
                expiresAt
            });

        }

        await sendEmailOTP(email, otp);

        return res.status(200).json({
            success: true,
            message: "OTP Sent Successfully"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
};


const verifyLogInOTPEmail = async (req,res)=>{
    try{
    const { email, otp} = req.body;
    if(!email || !otp){
        return res.status(402).json({
            message: "Credentials missing"
        })
    }

    const otpdata = await LoginOTP.findOne({email})
    if(!otpdata){
        return res.status(400).json({
                message: "OTP not found"
            });
    }

    if(otpdata.expiresAt < Date.now()){
        return res.status(400).json({
                message: "OTP expired"
            });
    }

    if(otpdata.otp !== otp){
        return res.status(400).json({
                message: "Invalid OTP"
            });
    }

    const userData = await User.findOne({email});
    // const token = generateToken(res, userData);
    setAccessTokenCookie(res, userData);
    const refreshToken = setRefreshTokenCookie(res, userData);
        await createRefreshSession(userData._id, refreshToken);

    await LoginOTP.deleteOne({email});

    return res.status(200).json({
    success: true,
    message: "Login Successful",
    user: {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone
    }
});
    

    }catch(error){
         console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


module.exports = {logIn, sendLogInOTPEmail, verifyLogInOTPEmail}