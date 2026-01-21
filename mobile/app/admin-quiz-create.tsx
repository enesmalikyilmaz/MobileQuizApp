import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postJson } from "../src/services/api";
import { router } from "expo-router";

type Q = { text: string; choicesText: string; answerIndexText: string };

export default function AdminQuizCreate() {
    const [title, setTitle] = useState("Yeni Quiz");
    const [description, setDescription] = useState("");
    const [msg, setMsg] = useState("");
    const [category, setCategory] = useState("Genel Kültür");


    const [questions, setQuestions] = useState<Q[]>([
        { text: "Soru 1", choicesText: "A,B,C,D", answerIndexText: "0" },
    ]);

    function addQuestion() {
        setQuestions([
            ...questions,
            { text: `Soru ${questions.length + 1}`, choicesText: "A,B,C,D", answerIndexText: "0" },
        ]);
    }

    function removeQuestion(idx: number) {
        setQuestions(questions.filter((_, i) => i !== idx));
    }

    function updateQuestion(idx: number, patch: Partial<Q>) {
        setQuestions(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    }

    async function submit() {
        try {
            setMsg("");

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setMsg("Token yok. Login ol.");
                return;
            }

            if (!title.trim()) {
                setMsg("Quiz adı boş olamaz.");
                return;
            }

            // questions -> backend formatına çevir
            const payloadQuestions = questions.map((q, idx) => {
                const choices = q.choicesText
                    .split(",")
                    .map(s => s.trim())
                    .filter(Boolean);

                const answerIndex = Number(q.answerIndexText);

                if (!q.text.trim()) throw new Error(`Soru ${idx + 1}: text boş`);
                if (choices.length < 2) throw new Error(`Soru ${idx + 1}: en az 2 seçenek olmalı`);
                if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= choices.length) {
                    throw new Error(`Soru ${idx + 1}: answerIndex 0-${choices.length - 1} arası olmalı`);
                }

                return { text: q.text.trim(), choices, answerIndex };
            });

            const body = {
                title: title.trim(),
                category: category.trim() || "Genel",
                description: description || "",
                questions: payloadQuestions,
            };


            const resp = await postJson<any>("/quizzes", body, token);
            setMsg("✅ Quiz oluşturuldu: " + (resp?.id || ""));

            // geri dön
            router.back();
        } catch (e: any) {
            setMsg("Hata: " + (e?.message || String(e)));
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
                Admin - Quiz Oluştur
            </Text>

            {!!msg && (
                <Text style={{ marginBottom: 10, color: msg.startsWith("✅") ? "green" : "red" }}>
                    {msg}
                </Text>
            )}

            <Text style={{ fontWeight: "700", marginBottom: 6 }}>Quiz Adı</Text>
            <TextInput
                value={title}
                onChangeText={setTitle}
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

            <Text style={{ fontWeight: "700", marginBottom: 6 }}>Kategori</Text>
            <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Genel Kültür / Bilim / Tarih / Spor"
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />


            <Text style={{ fontWeight: "700", marginBottom: 6 }}>Açıklama</Text>
            <TextInput
                value={description}
                onChangeText={setDescription}
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 12 }}
            />

            <ScrollView style={{ flex: 1 }}>
                {questions.map((q, idx) => (
                    <View
                        key={idx}
                        style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 10, marginBottom: 10 }}
                    >
                        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Soru {idx + 1}</Text>

                        <TextInput
                            value={q.text}
                            onChangeText={(t) => updateQuestion(idx, { text: t })}
                            placeholder="Soru metni"
                            style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 8 }}
                        />

                        <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                            Seçenekler (virgülle): örn A,B,C,D
                        </Text>
                        <TextInput
                            value={q.choicesText}
                            onChangeText={(t) => updateQuestion(idx, { choicesText: t })}
                            placeholder="A,B,C,D"
                            style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 8 }}
                        />

                        <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                            Doğru şık index (0’dan başlar)
                        </Text>
                        <TextInput
                            value={q.answerIndexText}
                            onChangeText={(t) => updateQuestion(idx, { answerIndexText: t })}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 8 }}
                        />

                        {questions.length > 1 && (
                            <Pressable
                                onPress={() => removeQuestion(idx)}
                                style={{ padding: 10, backgroundColor: "#111827", borderRadius: 8 }}
                            >
                                <Text style={{ color: "white", textAlign: "center" }}>Soruyu Sil</Text>
                            </Pressable>
                        )}
                    </View>
                ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable
                    onPress={addQuestion}
                    style={{ flex: 1, padding: 12, backgroundColor: "#2563eb", borderRadius: 8 }}
                >
                    <Text style={{ color: "white", textAlign: "center" }}>Soru Ekle</Text>
                </Pressable>

                <Pressable
                    onPress={submit}
                    style={{ flex: 1, padding: 12, backgroundColor: "#16a34a", borderRadius: 8 }}
                >
                    <Text style={{ color: "white", textAlign: "center" }}>Kaydet</Text>
                </Pressable>
            </View>

            <Pressable
                onPress={() => router.back()}
                style={{ padding: 12, backgroundColor: "#6b7280", borderRadius: 8, marginTop: 10 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Geri</Text>
            </Pressable>
        </View>
    );
}
