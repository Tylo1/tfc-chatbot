const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const crypto = require("crypto");
const LoginToken = require("../models/LoginToken");
const { sendLoginCode } = require("../utils/mailer");

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&)"
            });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await LoginToken.deleteMany({ userId: newUser._id });
        await LoginToken.create({ userId: newUser._id, code, expiresAt });
        await sendLoginCode(email, code);

        res.json({ message: "Verification code sent to your email.", verifyPending: true, username });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.save(() => {
            res.json({ message: "Login successful" });
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// NEW ROUTE — verifies the 6-digit code the user types in
router.post("/verify-login", async (req, res) => {
    try {
        const { username, code } = req.body;
        if (!username || !code) {
            return res.status(400).json({ message: "Username and code are required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid code" });
        }

        const loginToken = await LoginToken.findOne({ userId: user._id, code });
        if (!loginToken || loginToken.used || loginToken.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        loginToken.used = true;
        await loginToken.save();

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.save(() => {
            res.json({ message: "Login successful" });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
});
router.get("/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" });
    }
    res.json({ username: req.session.username });
});

module.exports = router;