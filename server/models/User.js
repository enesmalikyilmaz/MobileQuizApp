const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },

        isAdmin: { type: Boolean, default: false },


        city: { type: String, default: "" },
        country: { type: String, default: "" },
        avatarUrl: { type: String, default: "" },

        stats: {
            totalGames: { type: Number, default: 0 },
            totalScore: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 },
        },

        achievements: [{ type: String }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);