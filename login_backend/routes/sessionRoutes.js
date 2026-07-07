const express = require("express");
const router = express.Router();
const getSessions = require("../controllers/sessionController")

router.get("/", getSessions)

module.exports = router;