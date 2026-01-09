import { View, Text, TextInput, Pressable } from "react-native";
import { useEffect, useRef, useState } from "react";
import { connectSocket, disconnectSocket } from "../src/services/socket";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";


export default function Lobby() {
    const [roomCode, setRoomCode] = useState("ROOM1");
    const [name, setName] = useState("Enes");
    const [connected, setConnected] = useState(false);
    const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
    const [msg, setMsg] = useState("");
    const [hostId, setHostId] = useState<string | null>(null);
    const params = useLocalSearchParams();
    const quizId = (params.quizId as string) || "";
    const [mySocketId, setMySocketId] = useState<string | null>(null);


    const roomCodeRef = useRef(roomCode);
    const nameRef = useRef(name);
    const joinedOnceRef = useRef(false);


    useEffect(() => {
        roomCodeRef.current = roomCode;
    }, [roomCode]);

    useEffect(() => {
        nameRef.current = name;
    }, [name]);


    useEffect(() => {
        const s = connectSocket();

        const onConnect = () => {
            setConnected(true);
            setMySocketId(s.id);

            const rc = (roomCodeRef.current || "").trim();
            const nm = (nameRef.current || "").trim();

            if (rc && nm && joinedOnceRef.current) {
                if (rc && nm && joinedOnceRef.current) {
                    s.emit("joinRoom", {
                        roomCode: rc,
                        name: nm,
                        quizId: quizId || null
                    });
                }

            }

        };
        const onDisconnect = () => setConnected(false);
        const onPlayersUpdate = (payload: any) => {
            setPlayers(payload.players);
            setHostId(payload.hostId);
        };
        const onGameStarted = () => {
            const rc = (roomCodeRef.current || "").trim();
            if (!rc) return;
            router.push(`/game?room=${encodeURIComponent(rc)}`);
        };



        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("playersUpdate", onPlayersUpdate);
        s.on("gameStarted", onGameStarted);


        return () => {
            s.off("connect", onConnect);
            s.off("disconnect", onDisconnect);
            s.off("playersUpdate", onPlayersUpdate);
            s.off("gameStarted", onGameStarted);
            disconnectSocket();
        };
    }, []);

    const join = () => {
        if (!roomCode.trim() || !name.trim()) {
            setMsg("Oda kodu ve isim boş olamaz.");
            return;
        }
        setMsg("");
        const s = connectSocket();
        s.emit("joinRoom", {
            roomCode: roomCode.trim(),
            name: name.trim(),
            quizId: quizId || null
        });
        joinedOnceRef.current = true;

    };

    const leave = () => {
        const s = connectSocket();
        s.emit("leaveRoom", { roomCode: roomCode.trim() });
        setPlayers([]);
    };

    const startGame = () => {
        const rc = roomCode.trim();
        if (!rc) return;

        const s = connectSocket();
        console.log("START GAME EMIT ->", { roomCode: rc, quizId });


        s.emit("startGame", { roomCode: rc });
    };

    return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Lobby</Text>

            <Text style={{ fontSize: 12, marginBottom: 8 }}>
                Socket: {connected ? "✅ connected" : "❌ disconnected"}
            </Text>

            <Text style={{ fontSize: 12, marginBottom: 8 }}>
                QuizId: {quizId ? "✅ seçildi" : "❌ yok"}
            </Text>


            <TextInput
                value={roomCode}
                onChangeText={setRoomCode}
                placeholder="Oda kodu"
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="İsmin"
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

            {!!msg && <Text style={{ color: "red", marginBottom: 10 }}>{msg}</Text>}

            <Pressable
                onPress={join}
                style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 8, marginBottom: 10 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Odaya Katıl</Text>
            </Pressable>

            <Pressable
                onPress={leave}
                style={{ padding: 12, backgroundColor: "#111827", borderRadius: 8, marginBottom: 10 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Odadan Çık</Text>
            </Pressable>

            {hostId && mySocketId && hostId === mySocketId && (
                <Pressable
                    onPress={startGame}
                    style={{
                        padding: 12,
                        backgroundColor: "#ef4444",
                        borderRadius: 8,
                        marginBottom: 10
                    }}
                >
                    <Text style={{ color: "white", textAlign: "center" }}>
                        Oyunu Başlat (Host)
                    </Text>
                </Pressable>
            )}


            <Text style={{ marginTop: 12, fontWeight: "700" }}>Oyuncular:</Text>
            {players.map((p) => (
                <Text key={p.id}>• {p.name}</Text>
            ))}

            <Pressable
                onPress={() => router.back()}
                style={{ padding: 12, backgroundColor: "#6b7280", borderRadius: 8, marginTop: 18 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Geri</Text>
            </Pressable>
        </View>
    );
}