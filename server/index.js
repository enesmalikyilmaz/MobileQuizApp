const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { connectDb } = require("./db");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");
const quizzesRoutes = require("./routes/quizzes");
const Quiz = require("./models/Quiz");
const GameResult = require("./models/GameResult");
const resultsRoutes = require("./routes/results");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const leaderboardRoutes = require("./routes/leaderboard");



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
app.use("/leaderboard", leaderboardRoutes);


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
        timer: null,
        correctCount: {},     
        wrongCount: {},
        finished: false,
        gameStartedAt: null,
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

    //JoinRoom
    socket.on("joinRoom", ({ roomCode, name,quizId, token }) => {
        if (!roomCode || !name) return;

        let userId = null;

        try {
            if (token && process.env.JWT_SECRET) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded?.userId || null;
            } else {
                console.warn("JWT_SECRET yok veya token gelmedi");
            }
        } catch (e) {
            console.warn("JWT verify fail:", e.message);
            userId = null;
        }



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
                timer: null,
                correctCount: {},     
                wrongCount: {},
                playerStats: {},
                gameStartedAt: null,
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
        room.players.push({ id: socket.id, name, userId });

        room.correctCount = room.correctCount || {};
        room.wrongCount = room.wrongCount || {};
        room.eliminated = room.eliminated || {};

        room.correctCount[socket.id] = room.correctCount[socket.id] || 0;
        room.wrongCount[socket.id] = room.wrongCount[socket.id] || 0;

        room.eliminated[socket.id] = room.eliminated[socket.id] || false;


        room.scores = room.scores || {};
        if (room.scores[socket.id] === undefined) room.scores[socket.id] = 0;

        io.to(roomCode).emit("playersUpdate", {
            players: room.players,
            hostId: room.hostId
        });
        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    //LeaveRoom
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

        io.to(roomCode).emit("playersUpdate", {
            players: room.players,
            hostId: room.hostId
        });


        if (room.players.length === 0) {
            if (room.timer) {
                clearTimeout(room.timer);
                room.timer = null;
            }
            rooms.delete(roomCode);
            return;
        }

        io.to(roomCode).emit("playersUpdate", {
            players: room.players,
            hostId: room.hostId
        });

        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));
    });

    //StartGame
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


        room.questions = [...quiz.questions];
        shuffleInPlace(room.questions);



        room.started = true;
        room.qIndex = 0;
        room.gameStartedAt = Date.now();


        room.eliminated = {};
        room.players.forEach(p => (room.eliminated[p.id] = false));
        room.answers = {};

        room.gameStartedAt = Date.now();     //  duration için
        room.finished = false;              //  double finalize engeli

        room.playerStats = {};              //  correct/wrong/eliminated burada tutulacak
        room.players.forEach(p => {
            room.playerStats[p.id] = {
                id: p.id,
                userId: p.userId || null,       
                name: p.name,
                score: room.scores?.[p.id] || 0,
                correctCount: 0,
                wrongCount: 0,
                eliminated: false,
            };
        });



        // skorları sıfırla
        room.scores = room.scores || {};
        room.players.forEach(p => {
            if (room.scores[p.id] === undefined) room.scores[p.id] = 0;
        });
        room.answers = {};

        io.to(roomCode).emit("gameStarted", {
            roomCode,
            hostId: room.hostId,
            total: room.questions.length
        });

        console.log("START", room.players.map(p => p.id), room.eliminated);


        // ilk soruyu yolla
        sendQuestion(io, roomCode, room);
        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));

    });

    //SubmitAnswer
    socket.on("submitAnswer", async ({ roomCode, questionId, choiceIndex }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.started) return;

        console.log("SUBMIT", {
            qIndex: room.qIndex,
            total: room.questions?.length,
            questionId,
            currentQuestionId: room.currentQuestionId,
            eliminated: room.eliminated
        });

        console.log("playersLen:", room.players?.length, "elimKeys:", Object.keys(room.eliminated || {}).length);

        // init
        room.answers = room.answers || {};
        room.scores = room.scores || {};
        room.eliminated = room.eliminated || {};
        room.playerStats = room.playerStats || {}; //  correct/wrong burada tutulacak

        // Elendiyse cevap kabul etme
        if (room.eliminated[socket.id]) return;

        // Host elendiyse yeni host seçimi
        if (room.hostId === socket.id) {
            room.hostId = pickNewHost(room);
        }
        io.to(roomCode).emit("playersUpdate", {
            players: room.players,
            hostId: room.hostId
        });


        const q = room.questions?.[room.qIndex];
        if (!q) return;

        const qid = String(q._id || q.id);
        if (String(qid) !== String(questionId)) return;

        // Aynı soru için ikinci kez cevap vermesin
        if (room.answers[socket.id] === qid) return;

        room.answers[socket.id] = qid;

        // playerStats entry garanti
        if (!room.playerStats[socket.id]) {
            const p = (room.players || []).find(x => x.id === socket.id);
            room.playerStats[socket.id] = {
                id: socket.id,
                userId: p?.userId || null,
                name: p?.name || "Player",
                score: room.scores[socket.id] || 0,
                correctCount: 0,
                wrongCount: 0,
                eliminated: false
            };
        }

        const st = room.playerStats[socket.id];

        //  doğru/yanlış işle
        if (choiceIndex === q.answerIndex) {
            const pts = q.points || 10;
            room.scores[socket.id] = (room.scores[socket.id] || 0) + pts;

            st.score = room.scores[socket.id];
            st.correctCount += 1;
        } else {
            st.wrongCount += 1;
            st.eliminated = true;

            room.eliminated[socket.id] = true;
            io.to(socket.id).emit("eliminated", { message: "❌ Yanlış cevap! Elendin." });
        }

        // tek sefer score update
        io.to(roomCode).emit("scoreUpdate", buildScoreList(room));

        const eliminatedMap = room.eliminated || {};
        const aliveCount = getAliveCount(room);

        if (aliveCount === 0) {
            if (room.timer) { clearTimeout(room.timer); room.timer = null; }
            await finalizeGame(io, roomCode, room);
            return;
        }


        //  Son soruysa kim cevap verirse versin sonuç ekranına geç
        const isLastQuestion = room.qIndex === room.questions.length - 1;
        if (isLastQuestion) {
            if (room.timer) {
                clearTimeout(room.timer);
                room.timer = null;
            }

            await finalizeGame(io, roomCode, room);
            return;
        }


        
    });

    //TimeUp
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



            const aliveCount = (room.players || []).filter(p => !room.eliminated?.[p.id]).length;
            if (aliveCount === 0) {
                room.started = false;

                const finalScores = buildScoreList(room);

                GameResult.create({
                    roomCode,
                    quizId: room.quizId || null,
                    totalQuestions: room.questions.length,
                    scores: finalScores
                }).catch(err => console.error("save result error:", err));

                io.to(roomCode).emit("gameFinished", { scores: finalScores });
            }

        }
    });

    //NextQuestion
    socket.on("nextQuestion", ({ roomCode }) => {
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || !room.started) return;

        if (room.eliminated?.[room.hostId]) {
            room.hostId = pickNewHost(room);
            io.to(roomCode).emit("playersUpdate", { players: room.players, hostId: room.hostId });
        }

        if (room.hostId !== socket.id) return;

        // timer varsa temizlenir
        if (room.timer) {
            clearTimeout(room.timer);
            room.timer = null;
        }

        room.qIndex++;

        if (room.qIndex >= room.questions.length) {
            return;
        }

        sendQuestion(io, roomCode, room);
    });

    // Disconnect
    socket.on("disconnect", ({ roomCode }) => {
        for (const [code, room] of rooms.entries()) {
            const before = room.players.length;

            room.players = room.players.filter((p) => p.id !== socket.id);

            if (before === room.players.length) continue; // bu odada yokmuş

            if (room.scores) delete room.scores[socket.id];
            if (room.answers) delete room.answers[socket.id];

            if (room.hostId === socket.id) {
                room.hostId = room.players.length ? room.players[0].id : null;
            }

            io.to(roomCode).emit("playersUpdate", {
                players: room.players,
                hostId: room.hostId
            });


            if (room.players.length === 0) {
                if (room.timer) {
                    clearTimeout(room.timer);
                    room.timer = null;
                }
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

function sendQuestion(io, roomCode, room) {
    const q = room.questions?.[room.qIndex];
    if (!q) return false;

    //  init garanti
    room.answers = {};
    room.eliminated = room.eliminated || {};
    room.playerStats = room.playerStats || {};
    room.scores = room.scores || {};

    const qid = String(q._id || q.id);
    room.currentQuestionId = qid;
    room.questionStartedAt = Date.now();

    // timer varsa temizle
    if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
    }

    // sadece elenmeyenlere gönder
    (room.players || []).forEach((p) => {
        if (room.eliminated[p.id]) return;

        io.to(p.id).emit("question", {
            id: qid,
            text: q.text,
            choices: q.choices,
            index: room.qIndex + 1,
            total: room.questions.length,
            seconds: 30,
            startedAt: room.questionStartedAt
        });
    });

    //  30sn sonra otomatik ilerleme
    room.timer = setTimeout(async () => {
        try {
            // oyun bitmişse tekrar işlem yapma (double finalize engeli)
            if (!room.started) return;
            if (room.finished) return;

            //  cevap vermeyenleri ele + wrongCount++ yaz
            (room.players || []).forEach((p) => {
                if (room.eliminated[p.id]) return;

                const answeredThis = room.answers?.[p.id] === qid;
                if (!answeredThis) {
                    room.eliminated[p.id] = true;

                    if (room.hostId === p.id) {
                        room.hostId = pickNewHost(room);
                    }


                    //  stats güncelle
                    if (!room.playerStats[p.id]) {
                        room.playerStats[p.id] = {
                            id: p.id,
                            userId: p.userId || null,
                            name: p.name || "Player",
                            score: room.scores[p.id] || 0,
                            correctCount: 0,
                            wrongCount: 0,
                            eliminated: false,
                        };
                    }

                    room.playerStats[p.id].wrongCount += 1;   
                    room.playerStats[p.id].eliminated = true; 

                    io.to(p.id).emit("eliminated", { message: " Süre doldu! Elendin." });
                }
            });

            io.to(roomCode).emit("playersUpdate", {
                players: room.players,
                hostId: room.hostId
            });


            io.to(roomCode).emit("scoreUpdate", buildScoreList(room));

            // hayatta kalan yoksa bitir
            const aliveCount = getAliveCount(room);
            if (aliveCount === 0) {
                await finalizeGame(io, roomCode, room);
                return;
            }

            // sıradaki soruya geç
            room.qIndex++;

            // quiz bitti mi kontrolü
            if (room.qIndex >= room.questions.length) {
                await finalizeGame(io, roomCode, room);
                return;
            }

            // yeni soruyu gönder
            sendQuestion(io, roomCode, room);
        } catch (e) {
            console.error("auto-next error:", e);
        }
    }, 30 * 1000);

    return true;
}

function getAliveCount(room) {
    const elim = room.eliminated || {};

    // eliminated map boşsa players'a düş
    const ids = Object.keys(elim);
    if (ids.length > 0) {
        return ids.filter(id => elim[id] !== true).length;
    }

    // fallback: players
    return (room.players || []).filter(p => (room.eliminated?.[p.id] !== true)).length;
}



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

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


function pickNewHost(room) {
    if (!room) return null;

    // önce elenmemişlerden seçim
    const alive = (room.players || []).find(p => !room.eliminated?.[p.id]);
    if (alive) return alive.id;

    const any = (room.players || [])[0];
    return any ? any.id : null;
}


async function finalizeGame(io, roomCode, room) {
    if (!room || room.finished) return;

    room.finished = true;
    room.started = false;

    if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
    }

    room.scores = room.scores || {};
    room.eliminated = room.eliminated || {};
    room.playerStats = room.playerStats || {};

    const durationSec = room.gameStartedAt
        ? Math.floor((Date.now() - room.gameStartedAt) / 1000)
        : 0;

    const scoresDetailed = (room.players || []).map((p) => {
        const st = room.playerStats[p.id] || {};
        const uid = p.userId || st.userId || null;

        return {
            id: p.id,
            userId: uid,                 // ✅ kritik
            name: p.name || st.name || "Player",
            score: Number(room.scores[p.id] || st.score || 0),
            correctCount: Number(st.correctCount || 0),
            wrongCount: Number(st.wrongCount || 0),
            eliminated: !!room.eliminated[p.id] || !!st.eliminated,
        };
    });

    scoresDetailed.sort((a, b) => b.score - a.score);

    const top = scoresDetailed[0] || null;
    const winner = top ? { id: top.id, name: top.name, score: top.score } : null;

    //  totalScore güncelle (userId varsa)
    try {
        const User = require("./models/User");
        for (const s of scoresDetailed) {
            if (!s.userId) continue;
            await User.updateOne(
                { _id: s.userId },
                { $inc: { totalScore: s.score } }
            );
        }
    } catch (err) {
        console.error("totalScore update error:", err);
    }

    //  GameResult kaydet
    try {
        await GameResult.create({
            roomCode,
            quizId: room.quizId || null,
            totalQuestions: room.questions?.length || 0,
            durationSec,
            winner,
            scores: scoresDetailed,
        });
    } catch (err) {
        console.error("save result error:", err);
    }

    io.to(roomCode).emit("gameFinished", {
        scores: scoresDetailed,
        winner,
        durationSec,
    });
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