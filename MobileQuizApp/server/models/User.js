const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        totalScore: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);