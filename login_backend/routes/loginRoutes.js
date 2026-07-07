const express = require("express");
const router = express.Router();

const {logIn, sendLogInOTPEmail, verifyLogInOTPEmail, sendLogInOTPPhone, verifyLogInOTPPhone} = require("../controllers/loginController");


router.post("/email/send", sendLogInOTPEmail);
router.post("/email/verify", verifyLogInOTPEmail);
router.post("/phone/send", sendLogInOTPPhone);
router.post("/phone/verify", verifyLogInOTPPhone);
router.post("/", logIn);




module.exports = router;