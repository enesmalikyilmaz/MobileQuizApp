import { View, Text, Pressable, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getJson } from "../../src/services/api";

type QuizItem = { _id: string; title: string; description?: string; category?: string };

const CATEGORIES = ["Tümü", "Genel", "Genel Kültür", "Bilim", "Tarih", "Spor"];

export default function TabHome() {
    const [token, setToken] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [msg, setMsg] = useState("");
    const [category, setCategory] = useState<string>(""); 

    useEffect(() => {
        AsyncStorage.getItem("token").then(setToken);
    }, []);

    async function load(cat: string) {
        try {
            setMsg("Quizler yükleniyor...");
            const path = category ? `/quizzes?category=${encodeURIComponent(category)}` : "/quizzes";
            const list = await getJson<QuizItem[]>(path);
            setQuizzes(list);
            setMsg("");
        } catch (e: any) {
            setMsg("Quiz listesi alınamadı: " + (e?.message || String(e)));
        }
    }

    useEffect(() => {
        const load = async () => {
            try {
                setMsg("Quizler yükleniyor...");
                const path = category ? `/quizzes?category=${encodeURIComponent(category)}` : "/quizzes";
                const list = await getJson<QuizItem[]>(path);
                setQuizzes(list);
                setMsg("");
            } catch (e: any) {
                setMsg("Quiz listesi alınamadı: " + (e?.message || String(e)));
            }
        };
        load();
    }, [category]);


    const logout = async () => {
        await AsyncStorage.removeItem("token");
        router.replace("/login");
    };

    const goLobby = (quizId: string) => {
        router.push(`/lobby?quizId=${encodeURIComponent(quizId)}`);
    };

    return (
        <View style={{ flex: 1, padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Home</Text>

            <Text style={{ marginBottom: 12 }}>Token: {token ? "✅ var" : "❌ yok"}</Text>

            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Kategori:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CATEGORIES.map((c) => (
                    <Pressable
                        key={c}
                        onPress={() => setCategory(c)}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: category === c ? "#2563eb" : "#ddd",
                            borderRadius: 999,
                            marginRight: 8,
                        }}
                    >
                        <Text style={{ color: category === c ? "#2563eb" : "#111827" }}>{c}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            {!!msg && <Text style={{ fontSize: 12, marginBottom: 10 }}>{msg}</Text>}



            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Quiz Seç:</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {["", "Genel", "Bilim", "Tarih", "Spor"].map((c) => (
                    <Pressable
                        key={c || "all"}
                        onPress={() => setCategory(c)}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: "#ddd",
                            backgroundColor: category === c ? "#111827" : "white",
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ color: category === c ? "white" : "black", fontSize: 12 }}>
                            {c === "" ? "Hepsi" : c}
                        </Text>
                    </Pressable>
                ))}
            </View>


            {quizzes.length === 0 ? (
                <Text style={{ fontSize: 12 }}>Quiz yok.</Text>
            ) : (
                quizzes.map((q) => (
                    <Pressable
                        key={q._id}
                        onPress={() => goLobby(q._id)}
                        style={{ padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 8 }}
                    >
                        <Text style={{ fontWeight: "700" }}>{q.title}</Text>
                        <Text style={{ fontSize: 12, color: "#6b7280" }}>{q.category || "Genel"}</Text>
                        {!!q.description && <Text style={{ fontSize: 12 }}>{q.description}</Text>}
                    </Pressable>
                ))
            )}

            <Pressable onPress={logout} style={{ padding: 12, backgroundColor: "#ef4444", borderRadius: 8, marginTop: 12 }}>
                <Text style={{ color: "white", textAlign: "center" }}>Logout</Text>
            </Pressable>
        </View>
    );
}
