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
    seconds?: number; 
    startedAt?: number; 
};

type ScoreItem = { id: string; name: string; score: number };

export default function Game() {
    const params = useLocalSearchParams<{ room?: string }>();
    const room = params.room ?? "";

    const [hostId, setHostId] = useState<string>("");

    const [answered, setAnswered] = useState(false);
    const [question, setQuestion] = useState<Q | null>(null);
    const [scores, setScores] = useState<ScoreItem[]>([]);
    const [msg, setMsg] = useState("");
    const [timeLeft, setTimeLeft] = useState(30);
    const [isEliminated, setIsEliminated] = useState(false);
    const [eliminateMsg, setEliminateMsg] = useState("");
    const [deadlineMs, setDeadlineMs] = useState<number>(0);


    const [mySocketId, setMySocketId] = useState("");

    // Timer: her saniye düş
    useEffect(() => {
        if (!deadlineMs) return;
        if (answered) return;
        if (isEliminated) return;

        const t = setInterval(() => {
            const left = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
            setTimeLeft(left);

            if (left <= 0) {
                setAnswered(true);
                setMsg(" Süre bitti!");
                clearInterval(t);
            }
        }, 250);

        return () => clearInterval(t);
    }, [deadlineMs, answered , isEliminated]);


    

    // Socket eventleri
    useEffect(() => {
        const s = connectSocket();
        setMySocketId(s.id || "");

        const onQuestion = (q: any) => {
            setQuestion(q);
            setMsg("");
            setAnswered(false);
            setIsEliminated(false);
            setEliminateMsg("");


            const startedAt = Number(q.startedAt || Date.now());
            const sec = Number(q.seconds || 30);

            const deadline = startedAt + sec * 1000;
            setDeadlineMs(deadline);

            const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setTimeLeft(left);
        };

        const onPlayersUpdate = (payload: any) => {
            setHostId(payload?.hostId || "");
        };



        const onScoreUpdate = (list: any[]) => setScores(list);

        const onFinished = (payload: any) => {
            const finalScores = payload?.scores || [];
            router.replace({
                pathname: "/result",
                params: {
                    room,
                    scores: JSON.stringify(finalScores),
                },
            } as any);

        };

        const onErrorMsg = (p: any) => setMsg(p?.message || "Hata oluştu");

        // Server yanlışta veya süre dolunca bunu yolluyor
        const onEliminated = (p: any) => {
            setIsEliminated(true);
            setEliminateMsg(p?.message || "Elendin.");
            setAnswered(true);
            setMsg(p?.message || "Elendin.");
        };


        s.on("question", onQuestion);
        s.on("scoreUpdate", onScoreUpdate);
        s.on("gameFinished", onFinished);
        s.on("errorMsg", onErrorMsg);
        s.on("eliminated", onEliminated);
        s.on("playersUpdate", onPlayersUpdate);



        return () => {
            s.off("question", onQuestion);
            s.off("scoreUpdate", onScoreUpdate);
            s.off("gameFinished", onFinished);
            s.off("errorMsg", onErrorMsg);
            s.off("eliminated", onEliminated);
            s.off("playersUpdate", onPlayersUpdate);
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

                    {isEliminated ? (
                        <View style={{ padding: 12, borderWidth: 1, borderColor: "#ef4444", borderRadius: 10, marginBottom: 10 }}>
                            <Text style={{ fontWeight: "700", color: "#ef4444", fontSize: 16 }}>ELENDİN ❌</Text>
                            <Text style={{ marginTop: 4 }}>{eliminateMsg}</Text>
                            <Text style={{ marginTop: 6, color: "#6b7280" }}>Diğer oyuncuları bekliyorsun…</Text>
                        </View>
                    ) : null}


                    {question.choices.map((c, i) => (
                        <Pressable
                            key={i}
                            onPress={() => {
                                if (isEliminated) return;
                                answer(i);
                            }}
                            style={{
                                padding: 12,
                                borderWidth: 1,
                                borderColor: "#ddd",
                                borderRadius: 8,
                                marginBottom: 8,
                                opacity: (answered || isEliminated) ? 0.4 : 1
                            }}
                        >
                            <Text>{c}</Text>
                        </Pressable>
                    ))}

                    {!!msg && <Text style={{ marginTop: 6 }}>{msg}</Text>}

                    {hostId && mySocketId && hostId === mySocketId && !isEliminated && (
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
