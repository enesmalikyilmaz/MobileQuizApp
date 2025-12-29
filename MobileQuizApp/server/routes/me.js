const express = require("express");
const User = require("../models/User");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
    const user = await User.findById(req.user.userId).select("name email totalScore createdAt");
    if (!user) return res.status(404).json({ message: "User yok" });
    res.json({ user });
});

module.exports = router;