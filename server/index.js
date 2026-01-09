const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { connectDb } = require("./db");

const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");
const quizzesRoutes = require("./routes/quizzes");
const Quiz = require("./models/Quiz");


const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ ok: true, message: "API is running", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/quizzes", quizzesRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

const { demo } = require("./routes/quizzes");

const rooms = new Map();
// roomCode -> {
//   players: [{id,name}],
//   scores: { [socketId]: number },
//   started: boolean,
//   qIndex: number
// }

io.on("connection", (socket) => {
    console.log("connected", socket.id);

    socket.on("joinRoom", ({ roomCode, name,quizId }) => {
        if (!roomCode || !name) return;

        socket.join(roomCode);

        if (!rooms.has(roomCode)) {
            rooms.set(roomCode, {
                players: [],
                scores: {},
                started: false,
                qIndex: 0,
                hostId: socket.id,
                answers: {},
                questions: []
            });
        }

        const room = rooms.get(roomCode);
        if (!room.quizId && quizId) room.quizId = quizId;


        // Aynı socket aynı odaya tekrar eklenmesin
        room.players = room.players.filter((p) => p.id !== socket.id);
        room.players.push({ id: socket.id, name });

        room.scores = room.scores || {};
        if (room.scores[socket.id] === undefined) room.scores[socket.id] = 0;

        io.to(roomCode).emit("playersUpdate", {
            players: room.players,
            hostId: room.hostId
        });
        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    socket.on("leaveRoom", ({ roomCode }) => {
        if (!roomCode) return;

        socket.leave(roomCode);

        const room = rooms.get(roomCode);
        if (!room) return;

        room.players = room.players.filter((p) => p.id !== socket.id);
        io.to(roomCode).emit("playersUpdate", {
            players: room.players,
            hostId: room.hostId
        });

    });

    socket.on("startGame", async ({ roomCode }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        const quiz = await Quiz.findById(room.quizId);
        if (!quiz || !quiz.questions || quiz.questions.length === 0) return;

        // DB'yi her soru için tekrar çağırmamak için
        room.questions = quiz.questions;


        room.started = true;
        room.qIndex = 0;

        // skorları sıfırla
        room.scores = room.scores || {};
        room.players.forEach(p => {
            if (room.scores[p.id] === undefined) room.scores[p.id] = 0;
        });
        room.answers = {};


        // ilk soruyu yolla
        const q = room.questions[room.qIndex];
        if (!q) return;


        io.to(roomCode).emit("gameStarted", { total: room.questions.length });
        io.to(roomCode).emit("question", {
            id: q.id,
            text: q.text,
            choices: q.choices,
            index: room.qIndex + 1,
            total: room.questions.length,
        });

        // skor yayınla
        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    socket.on("submitAnswer", ({ roomCode, questionId, choiceIndex }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.started) return;

        room.answers = room.answers || {};

        if (room.answers[socket.id] === questionId) {
            return; // bu soru için zaten cevap vermiş
        }

        room.answers[socket.id] = questionId;


        const q = room.questions?.[room.qIndex];
        if (!q) return;

        if (String(q.id) !== String(questionId)) return;


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

        if (room.qIndex >= room.questions.length) {
            room.started = false;
            io.to(roomCode).emit("gameFinished", { scores: buildScoreList(room) });
            return;
        }


        room.answers = {};


        const q = room.questions[room.qIndex];
        io.to(roomCode).emit("question", {
            id: q.id,
            text: q.text,
            choices: q.choices,
            index: room.qIndex + 1,
            total: room.questions.length
        });
    });


    socket.on("disconnect", () => {
        for (const [code, room] of rooms.entries()) {
            const before = room.players.length;
            room.players = room.players.filter((p) => p.id !== socket.id);
            if (room.players.length !== before) {
                io.to(code).emit("playersUpdate", {
                    players: room.players,
                    hostId: room.hostId
                });
            }
        }
    });
}); 

function buildScoreList(room) {
    const list = (room.players || []).map(p => ({
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