const express = require("express");
const User = require("../models/User");
const { authRequired } = require("../middleware/auth");

const router = express.Router();


router.get("/", authRequired, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
            "name email city country avatarUrl stats achievements createdAt"
        );

        if (!user) {
            return res.status(404).json({ message: "Kullanýcý bulunamadý" });
        }

        res.json({ user });
    } catch (err) {
        console.error("GET /me error:", err);
        res.status(500).json({ message: "Profil alýnamadý" });
    }
});


router.put("/", authRequired, async (req, res) => {
    try {
        const { city, country, avatarUrl } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "Kullanýcý bulunamadý" });
        }

        if (city !== undefined) user.city = city;
        if (country !== undefined) user.country = country;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        await user.save();

        res.json({
            message: "Profil güncellendi",
            user: {
                name: user.name,
                email: user.email,
                city: user.city,
                country: user.country,
                avatarUrl: user.avatarUrl,
                stats: user.stats,
                achievements: user.achievements,
            },
        });
    } catch (err) {
        console.error("PUT /me error:", err);
        res.status(500).json({ message: "Profil güncellenemedi" });
    }
});

module.exports = router;
