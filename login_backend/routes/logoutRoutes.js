const express = require("express")
const router = express.Router();
const {logout, logoutAll} = require("../controllers/logoutController");


router.post("/all",logoutAll)
router.post("/",logout)

module.exports = router;