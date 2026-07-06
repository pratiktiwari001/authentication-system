const express = require("express");
const router = express.Router();

const {register,verifyotp,getProfile,forgotPassword, forgotPasswordOTPVerify, changePassword, generateNewAccessToken} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/verify-otp", verifyotp);
router.get("/profile", authMiddleware, getProfile)
router.post("/forgot-password/otp-verify", forgotPasswordOTPVerify)
router.post("/forgot-password/reset-password", changePassword)
router.post("/forgot-password", forgotPassword)
router.post("/refresh-token", generateNewAccessToken)


module.exports = router;