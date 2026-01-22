const express = require("express");
const User = require("../models/User");
const GameResult = require("../models/GameResult");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
    const user = await User.findById(req.user.userId).select(
        "name email city country isAdmin createdAt"
    );
    if (!user) return res.status(404).json({ message: "User yok" });

    const agg = await GameResult.aggregate([
        { $unwind: "$scores" },
        { $match: { "scores.userId": user._id } },
        {
            $group: {
                _id: "$scores.userId",
                totalGames: { $sum: 1 },
                totalScore: { $sum: "$scores.score" },
                bestScore: { $max: "$scores.score" },
            },
        },
    ]);

    const stats = agg[0]
        ? {
            totalGames: agg[0].totalGames,
            totalScore: agg[0].totalScore,
            bestScore: agg[0].bestScore,
        }
        : { totalGames: 0, totalScore: 0, bestScore: 0 };

    res.json({ user: { ...user.toObject(), stats } });
});

router.put("/", authRequired, async (req, res) => {
    try {
        const { city, country } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }

        if (city !== undefined) user.city = city;
        if (country !== undefined) user.country = country;

        await user.save();

        res.json({
            message: "Profil güncellendi",
            user: {
                name: user.name,
                email: user.email,
                city: user.city,
                country: user.country,
                stats: user.stats,
            },
        });
    } catch (err) {
        console.error("PUT /me error:", err);
        res.status(500).json({ message: "Profil güncellenemedi" });
    }
});

module.exports = router;
