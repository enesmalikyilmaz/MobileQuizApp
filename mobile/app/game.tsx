import { View, Text, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { connectSocket } from "../src/services/socket";

type Q = {
    id: string;
    text: string;
    choices: string[];
    index: number;
    total: number;
    seconds?: number; // server gönderiyor: 30
};

type ScoreItem = { id: string; name: string; score: number };

export default function Game() {
    const params = useLocalSearchParams();
    const room = (params.room as string) || "";
    const hostId = (params.hostId as string) || "";

    const [answered, setAnswered] = useState(false);
    const [question, setQuestion] = useState<Q | null>(null);
    const [scores, setScores] = useState<ScoreItem[]>([]);
    const [msg, setMsg] = useState("");
    const [timeLeft, setTimeLeft] = useState(30);

    const [mySocketId, setMySocketId] = useState<string>("");

    // Timer: her saniye düş
    useEffect(() => {
        if (!question) return;
        if (answered) return;
        if (timeLeft <= 0) return;

        const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, question, answered]);

    // Süre bittiğinde server'a bildir ve kilitle
    useEffect(() => {
        if (!question) return;

        if (timeLeft <= 0 && !answered) {
            setAnswered(true);
            setMsg("⏰ Süre bitti!");

            // server'a timeUp gönder (elenme kuralı için)
            const s = connectSocket();
            s.emit("timeUp", { roomCode: room, questionId: question.id });
        }
    }, [timeLeft, question, answered, room]);

    // Socket eventleri
    useEffect(() => {
        const s = connectSocket();
        setMySocketId(s.id || "");

        const onQuestion = (q: any) => {
            setQuestion(q);
            setMsg("");
            setAnswered(false);

            const secs = typeof q?.seconds === "number" ? q.seconds : 30;
            setTimeLeft(secs);
        };

        const onScoreUpdate = (list: any[]) => setScores(list);

        const onFinished = (payload: any) => {
            const finalScores = payload?.scores || [];
            const url =
                `/result?room=${encodeURIComponent(room)}` +
                `&scores=${encodeURIComponent(JSON.stringify(finalScores))}`;
            router.replace(url);
        };

        const onErrorMsg = (p: any) => setMsg(p?.message || "Hata oluştu");

        // Server yanlışta/süre dolunca bunu yolluyor
        const onEliminated = (p: any) => {
            setAnswered(true);
            setMsg(p?.message || "Elendin.");
        };

        s.on("question", onQuestion);
        s.on("scoreUpdate", onScoreUpdate);
        s.on("gameFinished", onFinished);
        s.on("errorMsg", onErrorMsg);
        s.on("eliminated", onEliminated);

        return () => {
            s.off("question", onQuestion);
            s.off("scoreUpdate", onScoreUpdate);
            s.off("gameFinished", onFinished);
            s.off("errorMsg", onErrorMsg);
            s.off("eliminated", onEliminated);
        };
    }, [room]);

    const answer = (choiceIndex: number) => {
        if (!question) return;
        if (answered) return;

        setAnswered(true);

        const s = connectSocket();
        s.emit("submitAnswer", {
            roomCode: room,
            questionId: question.id,
            choiceIndex,
        });

        setMsg("Cevap gönderildi ✅");
    };

    const next = () => {
        const s = connectSocket();
        s.emit("nextQuestion", { roomCode: room });
    };

    const isHost = hostId && mySocketId && hostId === mySocketId;

    return (
        <View style={{ flex: 1, padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>Game</Text>
            <Text style={{ fontSize: 12, marginBottom: 12 }}>Oda: {room}</Text>

            {question ? (
                <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, marginBottom: 6 }}>
                        Soru {question.index}/{question.total}
                    </Text>

                    <Text style={{ fontSize: 12, marginBottom: 8 }}>
                        ⏱ Kalan süre: {timeLeft}s
                    </Text>

                    <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
                        {question.text}
                    </Text>

                    {question.choices.map((c, i) => (
                        <Pressable
                            key={i}
                            onPress={() => answer(i)}
                            style={{
                                padding: 12,
                                borderWidth: 1,
                                borderColor: "#ddd",
                                borderRadius: 8,
                                marginBottom: 8,
                                opacity: answered ? 0.6 : 1,
                            }}
                        >
                            <Text>{c}</Text>
                        </Pressable>
                    ))}

                    {!!msg && <Text style={{ marginTop: 6 }}>{msg}</Text>}

                    {isHost && (
                        <Pressable
                            onPress={next}
                            style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 8, marginTop: 10 }}
                        >
                            <Text style={{ color: "white", textAlign: "center" }}>Sonraki Soru (Host)</Text>
                        </Pressable>
                    )}
                </View>
            ) : (
                <Text>Henüz soru gelmedi... (Host başlatınca gelir)</Text>
            )}

            <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: "700", marginBottom: 6 }}>Skorlar</Text>
                {scores.map((s) => (
                    <Text key={s.id}>
                        • {s.name}: {s.score}
                    </Text>
                ))}
            </View>

            <Pressable
                onPress={() => router.back()}
                style={{ padding: 12, backgroundColor: "#6b7280", borderRadius: 8, marginTop: 18 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Geri</Text>
            </Pressable>
        </View>
    );
}
