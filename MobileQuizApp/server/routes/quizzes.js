const express = require("express");
const Quiz = require("../models/Quiz");

const router = express.Router();

// GET /quizzes -> liste
router.get("/", async (req, res) => {
    const list = await Quiz.find({}, { title: 1, description: 1 }).sort({ createdAt: -1 });
    res.json(list);
});

// GET /quizzes/:id -> detay
router.get("/:id", async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
});

router.post("/seed/demo", async (req, res) => {
    const exists = await Quiz.findOne({ title: "Demo Quiz" });
    if (exists) return res.json({ ok: true, message: "Demo already exists", id: exists._id });

    const demo = await Quiz.create({
        title: "Demo Quiz",
        description: "Örnek quiz",
        questions: [
            {
                text: "Türkiye'nin baþkenti neresidir?",
                choices: ["Ýstanbul", "Ankara", "Ýzmir", "Bursa"],
                answerIndex: 1,
            },
            {
                text: "2 + 2 kaç eder?",
                choices: ["3", "4", "5", "22"],
                answerIndex: 1,
            },
            {
                text: "React Native'de yazý için hangi component?",
                choices: ["Div", "Span", "Text", "Label"],
                answerIndex: 2,
            },
        ],
    });

    res.json({ ok: true, id: demo._id });
});



module.exports = router;