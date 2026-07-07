require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js")
const loginRoutes = require("./routes/loginRoutes.js")
const logoutRoutes = require("./routes/logoutRoutes.js")
const sessionRoutes = require("./routes/sessionRoutes.js")
const authMiddleware = require("./middlewares/authMiddleware")
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

connectDB();

app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'https://authentication-system-new.vercel.app'], 
    credentials: true
}));
app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/logout", authMiddleware, logoutRoutes);
app.use("/api/sessions", authMiddleware, sessionRoutes)
app.use("/", (req,res)=>{
    res.send("API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`App is running on ${PORT}`)
});


