const mongoose = require("mongoose");

async function connectDb() {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI .env içinde yok!");

    await mongoose.connect(uri);
    console.log("MongoDB connected");
}

module.exports = { connectDb };