const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function signToken(user) {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// POST /auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        if (!name || !email || !password)
            return res.status(400).json({ message: "name/email/password zorunlu" });

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(409).json({ message: "Bu email zaten kayıtlı" });

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, passwordHash });

        return res.json({
            user: { id: user._id, name: user.name, email: user.email },
            token: signToken(user),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Register hata" });
    }
});

// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password)
            return res.status(400).json({ message: "email/password zorunlu" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ message: "Email veya şifre hatalı" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: "Email veya şifre hatalı" });

        return res.json({
            user: { id: user._id, name: user.name, email: user.email },
            token: signToken(user),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Login hata" });
    }
});

module.exports = router;