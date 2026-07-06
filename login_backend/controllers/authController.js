const User = require("../models/Users");
const OTP = require("../models/OTP");
const ForgotPasswordOTP = require("../models/ForgotPasswordOTP")
const RefreshToken = require("../models/RefreshToken")

const generateOTP = require("../utils/generateOTP");

const sendEmailOTP = require("../services/emailService");
const sendSMSOTP = require("../services/smsService");
const bcrypt = require("bcrypt");
const { setAccessTokenCookie, setRefreshTokenCookie } = require("../utils/generateToken");
const createRefreshSession = require("../utils/createRefreshSession")
const jwt = require("jsonwebtoken")


const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;


        const user = await User.findOne(
            // $or:[
            //     {email: email},
            //     {phone: phone}
            // ]
            { email }
        );

        if (user) {
            console.log("ERROR: User already exists")
            return res.status(400).json({
                message: "User already exists"
            })
        }

        const existingOTP = await OTP.findOne({ email });
        const emailOTP = generateOTP();
        const phoneOTP = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        if (existingOTP) {
            existingOTP.emailOTP = emailOTP;
            existingOTP.phoneOTP = phoneOTP;
            existingOTP.expiresAt = expiresAt;
            await existingOTP.save();
        }

        else {
            await OTP.create({
                name,
                email,
                phone,
                password,
                emailOTP,
                phoneOTP,
                expiresAt
            })
        }

        console.log(emailOTP);
        console.log(phoneOTP);
        await sendEmailOTP(email, emailOTP);
        await sendSMSOTP(process.env.TWILIO_TO_PHONE, phoneOTP);

        console.log("New User")
        res.status(200).json({ message: "Data received Successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const verifyotp = async (req, res) => {
    try {
        const { email, emailOTP, phoneOTP } = req.body;

        const otpData = await OTP.findOne({ email });
        if (!otpData) {
            return res.status(400).send("Please Register first")
        }
        if (otpData.expiresAt < new Date()) {
            return res.status(400).json({
                message: "OTP Expired"
            });
        }
        if (
            otpData.emailOTP !== emailOTP ||
            otpData.phoneOTP !== phoneOTP
        ) {
            return res.status(400).json({
                message: "Invalid OTP"
            });

        }

        const hashedPassword = await bcrypt.hash(otpData.password, 10);
        await User.create({
            name: otpData.name,
            email: otpData.email,
            phone: otpData.phone,
            password: hashedPassword,
            isEmailVerified: true,
            isPhoneVerified: true
        })

        await OTP.deleteOne({
            _id: otpData._id
        });

        return res.status(201).json({
            message: "User Registered Successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};



const getProfile = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(402).json({
                message: "Mail is missing"
            })
        }

        const isEmailExist = await User.findOne({ email });
        if (!isEmailExist) {
            return res.status(402).send("You have not registered yet")
        }
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const emailExists = await ForgotPasswordOTP.findOne({ email });

        if (emailExists) {
            emailExists.otp = otp;
            emailExists.expiresAt = expiresAt;
            await emailExists.save();
        } else {

            await ForgotPasswordOTP.create({
                email,
                otp,
                expiresAt
            });

        }
        await sendEmailOTP(email, otp);
        return res.status(200).json({
            message: "OTP to reset password is sent"
        })
    }
    catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

const forgotPasswordOTPVerify = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                message: "Credentials missing"
            });
        }

        const otpData = await ForgotPasswordOTP.findOne({ email });
        if (!otpData) {
            return res.status(400).json({
                message: "send OTP Again"
            });
        }

        if (otpData.expiresAt < new Date()) {
            return res.status(400).json({
                message: "OTP Expired"
            });
        }

        if (otpData.otp !== otp) {
            return res.status(400).json({
                message: "Your credentials are wrong"
            });
        }

        otpData.isOTPVerified = true;

        await otpData.save();

        return res.status(200).json({
            message: "OTP Verified Successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}
const changePassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        const isEmail = await ForgotPasswordOTP.findOne({ email })
        if (!isEmail) {
            return res.status(400).json({
                message: "OTP not exist"
            });
        }

        if (!(isEmail.isOTPVerified)) {
            return res.status(400).json({
                message: "Your OTP was wrong, reVerify it"
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Provide password"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10)

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true } //  Returns the updated user object directly!
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Drops the fresh cookie immediately using the updated document
        // generateToken(res, updatedUser);
        setAccessTokenCookie(res, updatedUser);
        const refreshToken = setRefreshTokenCookie(res, userData);
        await createRefreshSession(userData._id, refreshToken);
        await ForgotPasswordOTP.deleteOne({ email });

        res.status(200).json({
            message: "Password Changed Successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

const generateNewAccessToken = async (req, res) => {
    try{const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return res.status(401).json({
            message: 'Please Login Again'
        })
    }

    try {
        const decoded = await jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH)
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token"
        });
    }
    

    const session = await RefreshToken.findOne({
        refreshToken
    })
    
    if (!session) {
        return res.status(401).json({
            message: 'Session Expired'
        })
    }

    const user = await User.findById(session.user);
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    const newToken = setAccessTokenCookie(res, user);
    session.updatedAt = new Date();
    await session.save();

    return res.status(200).json({
        success: true,
        message: "Access token refreshed successfully"
    });}
    catch(error){
        return res.status(401).json({message: "Error in generating access token"})
    }

}

module.exports = { register, verifyotp, getProfile, forgotPassword, forgotPasswordOTPVerify, changePassword, generateNewAccessToken };