const express = require("express");
const GameResult = require("../models/GameResult");

const router = express.Router();

// GET /results -> son 50 sonuç
router.get("/", async (req, res) => {
    try {
        const list = await GameResult.find({}, {
            roomCode: 1,
            quizId: 1,
            totalQuestions: 1,
            durationSec: 1,
            winner: 1,
            createdAt: 1
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("quizId", "title") 
            .lean();

        res.json(list.map(r => ({
            _id: r._id,
            roomCode: r.roomCode,
            totalQuestions: r.totalQuestions,
            durationSec: r.durationSec,
            winner: r.winner,
            createdAt: r.createdAt,
            quizTitle: r.quizId?.title || "Bilinmeyen Quiz" 
        })));

    } catch (err) {
        console.error("results list error:", err);
        res.status(500).json({ message: "results list error" });
    }
});

// GET /results/:id -> detay
router.get("/:id", async (req, res) => {
    try {
        const r = await GameResult.findById(req.params.id)
            .populate("quizId", "title")
            .lean();
        if (!r) return res.status(404).json({ message: "result not found" });
        res.json(r);
    } catch (err) {
        console.error("result detail error:", err);
        res.status(500).json({ message: "result detail error" });
    }
});

module.exports = router;