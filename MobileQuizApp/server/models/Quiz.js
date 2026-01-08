const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },
        choices: [{ type: String, required: true }],
        answerIndex: { type: Number, required: true },
    },
    { _id: false }
);

const QuizSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        questions: { type: [QuestionSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Quiz", QuizSchema);