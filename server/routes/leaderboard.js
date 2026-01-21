const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const GameResult = require("../models/GameResult");

const router = express.Router();

function startOfPeriod(period) {
    const now = new Date();
    if (period === "weekly") {
        const day = now.getDay(); // 0 pazar
        const diff = (day === 0 ? 6 : day - 1); // pazartesi başlangıç
        const start = new Date(now);
        start.setDate(now.getDate() - diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }
    if (period === "monthly") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return start;
    }
    return null;
}

// GET /leaderboard/all-time
router.get("/all-time", async (req, res) => {
    const agg = await GameResult.aggregate([
        { $unwind: "$scores" },
        { $match: { "scores.userId": { $ne: null } } },
        {
            $group: {
                _id: "$scores.userId",
                score: { $sum: "$scores.score" },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                userId: "$_id",
                name: { $ifNull: ["$user.name", "Unknown"] },
                score: 1,
            },
        },
        { $sort: { score: -1 } },
        { $limit: 50 },
    ]);

    res.json(agg);
});


// GET /leaderboard/:period  (weekly | monthly)
router.get("/:period", async (req, res) => {
    const { period } = req.params;
    if (!["weekly", "monthly"].includes(period)) {
        return res.status(400).json({ message: "period weekly|monthly olmalı" });
    }

    const from = startOfPeriod(period);

    const agg = await GameResult.aggregate([
        { $match: { createdAt: { $gte: from } } },
        { $unwind: "$scores" },

        // userId'siz olanları ayrı ele alacağız; önce userId olanları topla:
        { $match: { "scores.userId": { $ne: null } } },

        {
            $group: {
                _id: "$scores.userId",
                score: { $sum: "$scores.score" },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                userId: "$_id",
                name: { $ifNull: ["$user.name", "Unknown"] },
                score: 1,
            },
        },
        { $sort: { score: -1 } },
        { $limit: 50 },
    ]);

    res.json(agg);
});

module.exports = router;
