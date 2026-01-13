const router = require("express").Router();
const GameResult = require("../models/GameResult");

router.get("/", async (req, res) => {
    const list = await GameResult.find().sort({ createdAt: -1 }).limit(20);
    res.json(list);
});

router.get("/:id", async (req, res) => {
    const item = await GameResult.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "not found" });
    res.json(item);
});

module.exports = router;