const twilio = require("twilio");

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);


const sendSMSOTP = async (phone, otp)=>{
    await client.messages.create({
        body: `Your OTP for verification is ${otp}`,
        from: process.env.TWILIO_PHONE,
        to: phone
    });
};

module.exports = sendSMSOTP;