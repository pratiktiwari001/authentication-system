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
        await createRefreshSession(userData._id, refreshToken, req);
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

        // console.error(error);

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
        await createRefreshSession(userData._id, refreshToken, req);

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
        //  console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

const sendLogInOTPPhone = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({
                message: "Phone number is required"
            });
        }

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                message: "User not found. Please register first."
            });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        let otpData = await LoginOTP.findOne({ phone });
        // console.log(otpData)

        if (otpData) {
            otpData.otp = otp;
            otpData.expiresAt = expiresAt;
            await otpData.save();
        } else {
            await LoginOTP.create({
                phone,
                otp,
                expiresAt
            });
        }

        await sendSMSOTP(process.env.TWILIO_TO_PHONE, otp);

        return res.status(200).json({
            message: "OTP sent successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

const verifyLogInOTPPhone = async(req,res)=>{
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                message: "Phone number and OTP are required"
            });
        }

        const otpData = await LoginOTP.findOne({ phone });
        if (!otpData) {
            return res.status(400).json({
                message: "Please request OTP again"
            });
        }

        if (otpData.expiresAt < new Date()) {
            await LoginOTP.deleteOne({ phone });

            return res.status(400).json({
                message: "OTP expired"
            });
        }

        if (otpData.otp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        setAccessTokenCookie(res, user);
        const refreshToken = setRefreshTokenCookie(res, user);
        await createRefreshSession(user._id, refreshToken, req);

        await LoginOTP.deleteOne({ phone });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {logIn, sendLogInOTPEmail, verifyLogInOTPEmail, sendLogInOTPPhone, verifyLogInOTPPhone}