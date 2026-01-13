const express = require("express");
const Quiz = require("../models/Quiz");
const { authRequired } = require("../middleware/auth");
const { adminRequired } = require("../middleware/admin");

const router = express.Router();

// 🔓 GET /quizzes -> herkes görebilir
router.get("/", async (req, res) => {
    const list = await Quiz.find(
        {},
        { title: 1, description: 1, category: 1 }
    ).sort({ createdAt: -1 });

    res.json(list);
});

// 🔓 GET /quizzes/:id -> herkes görebilir
router.get("/:id", async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
});

// 🔐 POST /quizzes -> SADECE ADMIN
router.post("/", authRequired, adminRequired, async (req, res) => {
    try {
        const { title, description, category, questions } = req.body;

        if (!title || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "title ve questions zorunlu" });
        }

        for (const q of questions) {
            if (!q.text || !Array.isArray(q.choices) || q.choices.length < 2) {
                return res.status(400).json({ message: "Soru formatı hatalı" });
            }
            if (typeof q.answerIndex !== "number") {
                return res.status(400).json({ message: "answerIndex zorunlu" });
            }
            if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) {
                return res.status(400).json({ message: "answerIndex choices aralığında olmalı" });
            }
        }

        const quiz = await Quiz.create({
            title,
            description: description || "",
            category: category || "Genel",
            questions,
        });

        res.json({ ok: true, id: quiz._id });
    } catch (err) {
        console.error("quiz create error:", err);
        res.status(500).json({ message: "quiz create error" });
    }
});

// 🔐 POST /quizzes/seed/demo -> SADECE ADMIN
router.post("/seed/demo", authRequired, adminRequired, async (req, res) => {
    const exists = await Quiz.findOne({ title: "Demo Quiz" });
    if (exists) {
        return res.json({ ok: true, message: "Demo already exists", id: exists._id });
    }

    const demo = await Quiz.create({
        title: "Demo Quiz",
        description: "Örnek quiz",
        category: "Genel",
        questions: [
            {
                text: "Türkiye'nin başkenti neresidir?",
                choices: ["İstanbul", "Ankara", "İzmir", "Bursa"],
                answerIndex: 1,
                difficulty: "easy",
                points: 10,
            },
            {
                text: "2 + 2 kaç eder?",
                choices: ["3", "4", "5", "22"],
                answerIndex: 1,
                difficulty: "easy",
                points: 10,
            },
            {
                text: "React Native'de yazı için hangi component?",
                choices: ["Div", "Span", "Text", "Label"],
                answerIndex: 2,
                difficulty: "medium",
                points: 15,
            },
        ],
    });

    res.json({ ok: true, id: demo._id });
});

module.exports = router;