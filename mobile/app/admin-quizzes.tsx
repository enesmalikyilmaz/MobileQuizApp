import { View, Text, Pressable, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJson } from "../src/services/api";
import { router } from "expo-router";

type QuizItem = {
    _id: string;
    title: string;
    category?: string;
    description?: string;
};

export default function AdminQuizzes() {
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [msg, setMsg] = useState("");

    async function load() {
        try {
            setMsg("Yükleniyor...");
            const token = await AsyncStorage.getItem("token");
            const list = await getJson<QuizItem[]>("/quizzes", token || undefined);
            setQuizzes(list);
            setMsg("");
        } catch (e: any) {
            setMsg("Quizler alınamadı: " + (e?.message || String(e)));
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
                Admin – Quiz Yönetimi
            </Text>

            {!!msg && <Text style={{ marginBottom: 10 }}>{msg}</Text>}

            <Pressable
                onPress={() => router.push("/admin-quiz-create")}
                style={{
                    padding: 12,
                    backgroundColor: "#16a34a",
                    borderRadius: 8,
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>
                    ➕ Yeni Quiz Oluştur
                </Text>
            </Pressable>

            <ScrollView>
                {quizzes.map(q => (
                    <View
                        key={q._id}
                        style={{
                            borderWidth: 1,
                            borderColor: "#ddd",
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ fontWeight: "700" }}>{q.title}</Text>
                        <Text style={{ fontSize: 12 }}>
                            Kategori: {q.category || "Genel"}
                        </Text>

                        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                            <Pressable
                                onPress={() => router.push(`/admin-quiz-edit?id=${q._id}`)}
                                style={{ padding: 8, backgroundColor: "#2563eb", borderRadius: 6 }}
                            >
                                <Text style={{ color: "white" }}>Düzenle</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {/* DELETE çağrısı */ }}
                                style={{ padding: 8, backgroundColor: "#ef4444", borderRadius: 6 }}
                            >
                                <Text style={{ color: "white" }}>Sil</Text>
                            </Pressable>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
