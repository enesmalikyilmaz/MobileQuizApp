const mongoose = require("mongoose");

const PlayerResultSchema = new mongoose.Schema(
    {
        id: String,                 
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        name: String,
        score: Number,
        correctCount: { type: Number, default: 0 },
        wrongCount: { type: Number, default: 0 },
        eliminated: { type: Boolean, default: false },
    },
    { _id: false }
);

const GameResultSchema = new mongoose.Schema(
    {
        roomCode: { type: String, required: true },

        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: false,
        },

        totalQuestions: { type: Number, default: 0 },

        durationSec: { type: Number, default: 0 },

        winner: {
            id: String,
            name: String,
            score: Number,
        },

        scores: { type: [PlayerResultSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("GameResult", GameResultSchema);