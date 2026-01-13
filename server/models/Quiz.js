const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },

        choices: [{ type: String, required: true }],

        answerIndex: { type: Number, required: true },

        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },

        points: {
            type: Number,
            default: 10,
        },
    },
    { _id: false }
);

const QuizSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },

        description: { type: String, default: "" },

        category: {
            type: String,
            default: "Genel",
        },

        questions: { type: [QuestionSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Quiz", QuizSchema);