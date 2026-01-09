import { View, Text, Pressable } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getJson } from "../../src/services/api";

type QuizItem = {
    _id: string;
    title: string;
    description?: string;
};

export default function TabHome() {
    const [token, setToken] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        AsyncStorage.getItem("token").then(setToken);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                setMsg("Quizler yükleniyor...");
                const list = await getJson<QuizItem[]>("/quizzes");
                setQuizzes(list);
                setMsg("");
            } catch (e: any) {
                setMsg("Quiz listesi alınamadı: " + (e?.message || String(e)));
            }
        };
        load();
    }, []);

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        router.replace("/login");
    };

    const goLobby = (quizId: string) => {
        router.push(`/lobby?quizId=${encodeURIComponent(quizId)}`);
    };

    return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
                Home
            </Text>

            <Text style={{ marginBottom: 12 }}>
                Token: {token ? "✅ var" : "❌ yok"}
            </Text>

            {!!msg && <Text style={{ fontSize: 12, marginBottom: 10 }}>{msg}</Text>}

            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Quiz Seç:</Text>

            {quizzes.length === 0 ? (
                <Text style={{ fontSize: 12 }}>Quiz yok (seed yaptın mı?).</Text>
            ) : (
                quizzes.map((q) => (
                    <Pressable
                        key={q._id}
                        onPress={() => goLobby(q._id)}
                        style={{
                            padding: 12,
                            borderWidth: 1,
                            borderColor: "#ddd",
                            borderRadius: 8,
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ fontWeight: "700" }}>{q.title}</Text>
                        {!!q.description && <Text style={{ fontSize: 12 }}>{q.description}</Text>}
                    </Pressable>
                ))
            )}

            <Pressable
                onPress={logout}
                style={{ padding: 12, backgroundColor: "#ef4444", borderRadius: 8, marginTop: 12 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Logout</Text>
            </Pressable>
        </View>
    );
}
