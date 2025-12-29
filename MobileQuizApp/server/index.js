const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { connectDb } = require("./db");

const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ ok: true, message: "API is running", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/me", meRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

const rooms = new Map(); // roomCode -> { players: [{id,name}] }

io.on("connection", (socket) => {
    console.log("connected", socket.id);

    socket.on("joinRoom", ({ roomCode, name }) => {
        if (!roomCode || !name) return;

        socket.join(roomCode);

        if (!rooms.has(roomCode)) rooms.set(roomCode, { players: [] });

        const room = rooms.get(roomCode);

        // Aynı socket aynı odaya tekrar eklenmesin
        room.players = room.players.filter((p) => p.id !== socket.id);
        room.players.push({ id: socket.id, name });

        io.to(roomCode).emit("playersUpdate", room.players);
    });

    socket.on("leaveRoom", ({ roomCode }) => {
        if (!roomCode) return;

        socket.leave(roomCode);

        const room = rooms.get(roomCode);
        if (!room) return;

        room.players = room.players.filter((p) => p.id !== socket.id);
        io.to(roomCode).emit("playersUpdate", room.players);
    });

    socket.on("disconnect", () => {
        for (const [code, room] of rooms.entries()) {
            const before = room.players.length;
            room.players = room.players.filter((p) => p.id !== socket.id);
            if (room.players.length !== before) {
                io.to(code).emit("playersUpdate", room.players);
            }
        }
    });
}); 

const PORT = process.env.PORT || 5000;

connectDb()
    .then(() => {
        server.listen(PORT, "0.0.0.0", () => {
            console.log(`API running on http://0.0.0.0:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connect error:", err.message);
        process.exit(1);
    });