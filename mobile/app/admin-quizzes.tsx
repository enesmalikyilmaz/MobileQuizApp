import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJson, deleteJson } from "../src/services/api";
import { router } from "expo-router";

type QuizItem = {
    _id: string;
    title: string;
    description?: string;
    category?: string;
};

export default function AdminQuizzes() {
    const [list, setList] = useState<QuizItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [category, setCategory] = useState(""); // filtre

    async function load() {
        try {
            setMsg("");
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setMsg("Token yok. Login ol.");
                return;
            }

            const qs = category.trim() ? `?category=${encodeURIComponent(category.trim())}` : "";
            const data = await getJson<QuizItem[]>(`/quizzes${qs}`, token);
            setList(data);
        } catch (e: any) {
            setMsg("Liste alınamadı: " + (e?.message || String(e)));
        } finally {
            setLoading(false);
        }
    }

    async function removeQuiz(id: string) {
        try {
            setMsg("");
            const token = await AsyncStorage.getItem("token");
            if (!token) return setMsg("Token yok.");

            await deleteJson(`/quizzes/${id}`, token);
            setMsg("✅ Silindi");
            await load();
        } catch (e: any) {
            setMsg("Silme hatası: " + (e?.message || String(e)));
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
                Admin - Quiz Yönetimi
            </Text>

            {!!msg && <Text style={{ marginBottom: 10, color: msg.startsWith("✅") ? "green" : "red" }}>{msg}</Text>}

            <Text style={{ fontWeight: "700" }}>Kategori filtre</Text>
            <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Örn: Bilim"
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

            <Pressable onPress={load} style={{ padding: 12, backgroundColor: "#111827", borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ color: "white", textAlign: "center" }}>Filtrele / Yenile</Text>
            </Pressable>

            <Pressable
                onPress={() => router.push("/admin-quiz-create")}
                style={{ padding: 12, backgroundColor: "#16a34a", borderRadius: 8, marginBottom: 12 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>+ Yeni Quiz Oluştur</Text>
            </Pressable>

            {loading ? (
                <Text>Yükleniyor...</Text>
            ) : (
                <ScrollView style={{ flex: 1 }}>
                    {list.map((q) => (
                        <View
                            key={q._id}
                            style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 12, marginBottom: 10 }}
                        >
                            <Text style={{ fontWeight: "700" }}>{q.title}</Text>
                            {!!q.category && <Text style={{ fontSize: 12, color: "#6b7280" }}>Kategori: {q.category}</Text>}
                            {!!q.description && <Text style={{ fontSize: 12 }}>{q.description}</Text>}

                            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                                <Pressable
                                    onPress={() => router.push(`/admin-quiz-edit?id=${encodeURIComponent(q._id)}`)}
                                    style={{ flex: 1, padding: 10, backgroundColor: "#2563eb", borderRadius: 8 }}
                                >
                                    <Text style={{ color: "white", textAlign: "center" }}>Düzenle</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => removeQuiz(q._id)}
                                    style={{ flex: 1, padding: 10, backgroundColor: "#ef4444", borderRadius: 8 }}
                                >
                                    <Text style={{ color: "white", textAlign: "center" }}>Sil</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))}
                    {list.length === 0 && <Text>Bu filtrede quiz yok.</Text>}
                </ScrollView>
            )}

            <Pressable onPress={() => router.back()} style={{ padding: 12, backgroundColor: "#6b7280", borderRadius: 8, marginTop: 10 }}>
                <Text style={{ color: "white", textAlign: "center" }}>Geri</Text>
            </Pressable>
        </View>
    );
}
