const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmailOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "OTP Verification",
            text: `Your OTP for verification is ${otp}`
        });
        console.log("Email Sent Successfully")
    }
    catch (error) {
        console.error("Error in sending the mail", error.message);
        throw error;
    }
};

module.exports = sendEmailOTP;