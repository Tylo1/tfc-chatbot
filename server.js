// Import the tools
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const rateLimit = require("express-rate-limit");

const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // 15 requests per minute per IP
    message: { message: "Too many messages, please slow down." }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 min per IP
    message: { message: "Too many attempts, please try again later." }
});
require('dotenv').config();

// Routes
const menuRoutes = require("./routes/menu");
const authRoutes = require("./routes/auth");
const dealRoutes = require("./routes/deals");
const chatRoutes = require("./routes/chat");

// Creation of server
const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Middleware to protect index.html
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login.html");
    }
    next();
}

app.get("/index.html", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve frontend files (login, register, images, css, js)
app.use(express.static(path.join(__dirname, 'public')));

//ROUTES use
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/chat", chatLimiter, chatRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected");
    })
    .catch(err => console.log(err));
    

// Start server 
const PORT = process.env.PORT || 3000;

app.listen(3000, async () => {
    console.log("Server running");
});