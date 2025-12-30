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

const { demo } = require("./quizzes");

const rooms = new Map();
// roomCode -> {
//   players: [{id,name}],
//   scores: { [socketId]: number },
//   started: boolean,
//   qIndex: number
// }

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

        room.scores = room.scores || {};
        if (room.scores[socket.id] === undefined) room.scores[socket.id] = 0;

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

    socket.on("startGame", ({ roomCode }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        room.started = true;
        room.qIndex = 0;

        // skorları sıfırla
        room.scores = room.scores || {};
        room.players.forEach(p => {
            if (room.scores[p.id] === undefined) room.scores[p.id] = 0;
        });

        // ilk soruyu yolla
        const q = demo[room.qIndex];
        io.to(roomCode).emit("gameStarted", { total: demo.length });
        io.to(roomCode).emit("question", {
            id: q.id,
            text: q.text,
            choices: q.choices,
            index: room.qIndex + 1,
            total: demo.length,
        });

        // skor yayınla
        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    socket.on("submitAnswer", ({ roomCode, questionId, choiceIndex }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.started) return;

        const q = demo[room.qIndex];
        if (!q || q.id !== questionId) return;

        // doğruysa +10 puan
        if (choiceIndex === q.answerIndex) {
            room.scores[socket.id] = (room.scores[socket.id] || 0) + 10;
        }

        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    socket.on("nextQuestion", ({ roomCode }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.started) return;

        room.qIndex++;

        if (room.qIndex >= demo.length) {
            room.started = false;
            io.to(roomCode).emit("gameFinished", { scores: buildScoreList(room) });
            return;
        }

        const q = demo[room.qIndex];
        io.to(roomCode).emit("question", {
            id: q.id,
            text: q.text,
            choices: q.choices,
            index: room.qIndex + 1,
            total: demo.length,
        });
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

function buildScoreList(room) {
    const list = room.players.map(p => ({
        id: p.id,
        name: p.name,
        score: room.scores?.[p.id] || 0,
    }));

    // skor büyükten küçüğe
    list.sort((a, b) => b.score - a.score);
    return list;
}


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