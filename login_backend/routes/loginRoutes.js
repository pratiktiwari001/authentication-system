const express = require("express");
const router = express.Router();

const {logIn, sendLogInOTPEmail, verifyLogInOTPEmail} = require("../controllers/loginController");


router.post("/email/send", sendLogInOTPEmail);
router.post("/email/verify", verifyLogInOTPEmail)
router.post("/", logIn);




module.exports = router;