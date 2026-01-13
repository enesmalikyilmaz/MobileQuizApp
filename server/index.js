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
const GameResult = require("./models/GameResult");
const resultsRoutes = require("./routes/results");



const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ ok: true, message: "API is running", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/quizzes", quizzesRoutes);
app.use("/results", resultsRoutes);


function generateRoomCode(len = 5) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0,O,1,I yok
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

app.post("/rooms/create", (req, res) => {
    let code;
    do {
        code = generateRoomCode(5);
    } while (rooms.has(code));

    // oda hemen açılabilir (players boş)
    rooms.set(code, {
        players: [],
        scores: {},
        started: false,
        qIndex: 0,
        hostId: null,
        answers: {},
        questions: [],
        quizId: null,

        eliminated: {},          // socketId -> true/false
        currentQuestionId: null,
        questionStartedAt: 0
    });


    res.json({ roomCode: code });
});


const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});


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
                questions: [],
                quizId: null,

                eliminated: {},
                currentQuestionId: null,
                questionStartedAt: 0
            });

        }

        const room = rooms.get(roomCode);
        if (!room.hostId) room.hostId = socket.id;
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

        if (room.scores) delete room.scores[socket.id];
        if (room.answers) delete room.answers[socket.id];

        if (room.hostId === socket.id) {
            room.hostId = room.players.length ? room.players[0].id : null;
        }

        if (room.players.length === 0) {
            rooms.delete(roomCode);
            return;
        }

        io.to(roomCode).emit("playersUpdate", {
            players: room.players,
            hostId: room.hostId
        });

        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    socket.on("startGame", async ({ roomCode }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        if (!room.quizId) {
            io.to(socket.id).emit("errorMsg", { message: "Quiz seçilmemiş. Home’dan quiz seçip lobby’ye gel." });
            return;
        }

        // sadece host oyunu başlatabilsin
        if (room.hostId !== socket.id) {
            io.to(socket.id).emit("errorMsg", { message: "Sadece host oyunu başlatabilir." });
            return;
        }


        const quiz = await Quiz.findById(room.quizId);
        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            io.to(socket.id).emit("errorMsg", { message: "Quiz bulunamadı veya soruları boş." });
            return;
        }

        // DB'yi her soru için tekrar çağırmamak için
        room.questions = [...quiz.questions].sort(() => Math.random() - 0.5);


        room.started = true;
        room.qIndex = 0;

        room.eliminated = {};
        room.players.forEach(p => (room.eliminated[p.id] = false));
        room.answers = {};


        // skorları sıfırla
        room.scores = room.scores || {};
        room.players.forEach(p => {
            if (room.scores[p.id] === undefined) room.scores[p.id] = 0;
        });
        room.answers = {};


        // ilk soruyu yolla
        const q = room.questions[room.qIndex];
        if (!q) return;


        io.to(roomCode).emit("gameStarted", {
            roomCode,
            hostId: room.hostId,
            total: room.questions.length
        });

        const qid = String(q._id || q.id);

        room.currentQuestionId = qid;
        room.questionStartedAt = Date.now();

        (room.players || []).forEach(p => {
            if (room.eliminated?.[p.id]) return;

            io.to(p.id).emit("question", {
                id: qid,
                text: q.text,
                choices: q.choices,
                index: room.qIndex + 1,
                total: room.questions.length,
                seconds: 30
            });
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

        const qid = String(q._id || q.id);
        if (String(qid) !== String(questionId)) return;


        // Eğer zaten elendiyse cevap kabul etme
        if (room.eliminated?.[socket.id]) return;

        // doğruysa puan ekle (q.points varsa onu kullan)
        if (choiceIndex === q.answerIndex) {
            const pts = q.points || 10;
            room.scores[socket.id] = (room.scores[socket.id] || 0) + pts;
        } else {
            // yanlış -> elen
            room.eliminated[socket.id] = true;
            io.to(socket.id).emit("eliminated", { message: "❌ Yanlış cevap! Elendin." });
        }


        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    socket.on("timeUp", ({ roomCode, questionId }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.started) return;

        // elenen tekrar işlenmesin
        if (room.eliminated?.[socket.id]) return;

        const q = room.questions?.[room.qIndex];
        if (!q) return;

        const qid = String(q._id || q.id);
        if (String(qid) !== String(questionId)) return;

        // Bu soru için cevap vermediyse elensin
        if (room.answers?.[socket.id] !== String(questionId)) {
            room.eliminated[socket.id] = true;
            io.to(socket.id).emit("eliminated", { message: "⏰ Süre doldu! Elendin." });

            io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
        }
    });


    socket.on("nextQuestion", ({ roomCode }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.started) return;

        if (room.hostId !== socket.id) return;

        const finalScores = buildScoreList(room);

        GameResult.create({
            roomCode,
            quizId: room.quizId || null,
            totalQuestions: room.questions.length,
            scores: finalScores
        }).catch(err => console.error("save result error:", err));

        room.qIndex++;

        if (room.qIndex >= room.questions.length) {
            room.started = false;
            io.to(roomCode).emit("gameFinished", { scores: finalScores });
            return;
        }


        room.answers = {};

        const q = room.questions[room.qIndex];
        const qid = String(q._id || q.id);

        room.currentQuestionId = qid;
        room.questionStartedAt = Date.now();

        (room.players || []).forEach(p => {
            if (room.eliminated?.[p.id]) return;

            io.to(p.id).emit("question", {
                id: qid,
                text: q.text,
                choices: q.choices,
                index: room.qIndex + 1,
                total: room.questions.length,
                seconds: 30
            });
        });


    });


    socket.on("disconnect", () => {
        for (const [code, room] of rooms.entries()) {
            const before = room.players.length;

            room.players = room.players.filter((p) => p.id !== socket.id);

            if (before === room.players.length) continue; // bu odada yokmuş

            if (room.scores) delete room.scores[socket.id];
            if (room.answers) delete room.answers[socket.id];

            if (room.hostId === socket.id) {
                room.hostId = room.players.length ? room.players[0].id : null;
            }

            if (room.players.length === 0) {
                rooms.delete(code);
                continue;
            }

            io.to(code).emit("playersUpdate", {
                players: room.players,
                hostId: room.hostId
            });

            io.to(code).emit("scoreUpdate", buildScoreList(room));
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