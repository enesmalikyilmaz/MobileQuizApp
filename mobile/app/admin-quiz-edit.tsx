import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJson, putJson, deleteJson } from "../src/services/api";

type ApiQuiz = {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    questions: { text: string; choices: string[]; answerIndex: number; points?: number }[];
};

type QForm = {
    text: string;
    choicesText: string;
    answerIndexText: string;
    pointsText: string;
};

export default function AdminQuizEdit() {
    const params = useLocalSearchParams();
    const id = (params.id as string) || "";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Genel");

    const [questions, setQuestions] = useState<QForm[]>([]);
    const [msg, setMsg] = useState("");

    const canSave = useMemo(() => title.trim().length > 0 && questions.length > 0, [title, questions.length]);

    function addQuestion() {
        setQuestions((prev) => [
            ...prev,
            { text: `Soru ${prev.length + 1}`, choicesText: "A,B,C,D", answerIndexText: "0", pointsText: "10" },
        ]);
    }

    function removeQuestion(idx: number) {
        setQuestions((prev) => prev.filter((_, i) => i !== idx));
    }

    function updateQuestion(idx: number, patch: Partial<QForm>) {
        setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    }

    async function load() {
        try {
            setMsg("");
            setLoading(true);

            if (!id) {
                setMsg("ID yok.");
                return;
            }

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setMsg("Token yok. Login ol.");
                return;
            }

            const quiz = await getJson<ApiQuiz>(`/quizzes/${encodeURIComponent(id)}`, token);

            setTitle(quiz.title || "");
            setDescription(quiz.description || "");
            setCategory(quiz.category || "Genel");

            const qs: QForm[] = (quiz.questions || []).map((q, i) => ({
                text: q.text || `Soru ${i + 1}`,
                choicesText: (q.choices || []).join(","),
                answerIndexText: String(q.answerIndex ?? 0),
                pointsText: String(q.points ?? 10),
            }));

            setQuestions(qs.length ? qs : [{ text: "Soru 1", choicesText: "A,B,C,D", answerIndexText: "0", pointsText: "10" }]);
        } catch (e: any) {
            setMsg("Yüklenemedi: " + (e?.message || String(e)));
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        try {
            setMsg("");
            setSaving(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setMsg("Token yok. Login ol.");
                return;
            }

            if (!title.trim()) return setMsg("Quiz adı boş olamaz.");
            if (!questions.length) return setMsg("En az 1 soru olmalı.");

            const payloadQuestions = questions.map((q, idx) => {
                const choices = q.choicesText
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);

                const answerIndex = Number(q.answerIndexText);
                const points = Number(q.pointsText || "10");

                if (!q.text.trim()) throw new Error(`Soru ${idx + 1}: text boş`);
                if (choices.length < 2) throw new Error(`Soru ${idx + 1}: en az 2 seçenek olmalı`);
                if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= choices.length) {
                    throw new Error(`Soru ${idx + 1}: answerIndex 0-${choices.length - 1} arası olmalı`);
                }

                return {
                    text: q.text.trim(),
                    choices,
                    answerIndex,
                    points: Number.isFinite(points) ? points : 10,
                };
            });

            const body = {
                title: title.trim(),
                description: description || "",
                category: (category || "Genel").trim(),
                questions: payloadQuestions,
            };

            await putJson(`/quizzes/${encodeURIComponent(id)}`, body, token);
            setMsg("✅ Kaydedildi");
            router.back();
        } catch (e: any) {
            setMsg("Kaydetme hatası: " + (e?.message || String(e)));
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        try {
            setMsg("");
            const token = await AsyncStorage.getItem("token");
            if (!token) return setMsg("Token yok.");

            await deleteJson(`/quizzes/${encodeURIComponent(id)}`, token);
            setMsg("✅ Silindi");
            router.back();
        } catch (e: any) {
            setMsg("Silme hatası: " + (e?.message || String(e)));
        }
    }

    useEffect(() => {
        load();
    }, [id]);

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
            <Text style={{ fontSize: 20, fontWeight: "900", marginBottom: 10 }}>Admin - Quiz Düzenle</Text>

            {!!msg && <Text style={{ marginBottom: 10, color: msg.startsWith("✅") ? "green" : "red" }}>{msg}</Text>}

            {loading ? (
                <Text>Yükleniyor...</Text>
            ) : (
                <>
                    <Text style={{ fontWeight: "800", marginBottom: 6 }}>Quiz Adı</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, marginBottom: 10 }}
                    />

                    <Text style={{ fontWeight: "800", marginBottom: 6 }}>Açıklama</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, marginBottom: 10 }}
                    />

                    <Text style={{ fontWeight: "800", marginBottom: 6 }}>Kategori</Text>
                    <TextInput
                        value={category}
                        onChangeText={setCategory}
                        placeholder="Örn: Bilim"
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, marginBottom: 12 }}
                    />

                    <ScrollView style={{ flex: 1 }}>
                        {questions.map((q, idx) => (
                            <View
                                key={idx}
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#eee",
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 12,
                                }}
                            >
                                <Text style={{ fontWeight: "900", marginBottom: 8 }}>Soru {idx + 1}</Text>

                                <TextInput
                                    value={q.text}
                                    onChangeText={(t) => updateQuestion(idx, { text: t })}
                                    placeholder="Soru metni"
                                    style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, marginBottom: 8 }}
                                />

                                <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                                    Seçenekler (virgülle): örn A,B,C,D
                                </Text>
                                <TextInput
                                    value={q.choicesText}
                                    onChangeText={(t) => updateQuestion(idx, { choicesText: t })}
                                    style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, marginBottom: 8 }}
                                />

                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Doğru şık index</Text>
                                        <TextInput
                                            value={q.answerIndexText}
                                            onChangeText={(t) => updateQuestion(idx, { answerIndexText: t })}
                                            keyboardType="numeric"
                                            style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10 }}
                                        />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Puan</Text>
                                        <TextInput
                                            value={q.pointsText}
                                            onChangeText={(t) => updateQuestion(idx, { pointsText: t })}
                                            keyboardType="numeric"
                                            style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10 }}
                                        />
                                    </View>
                                </View>

                                {questions.length > 1 && (
                                    <Pressable
                                        onPress={() => removeQuestion(idx)}
                                        style={{ padding: 12, backgroundColor: "#111827", borderRadius: 10, marginTop: 10 }}
                                    >
                                        <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Soruyu Sil</Text>
                                    </Pressable>
                                )}
                            </View>
                        ))}

                        <Pressable
                            onPress={addQuestion}
                            style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 12, marginBottom: 12 }}
                        >
                            <Text style={{ color: "white", textAlign: "center", fontWeight: "900" }}>+ Soru Ekle</Text>
                        </Pressable>
                    </ScrollView>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                        <Pressable
                            disabled={!canSave || saving}
                            onPress={save}
                            style={{
                                flex: 1,
                                padding: 14,
                                backgroundColor: !canSave || saving ? "#9ca3af" : "#16a34a",
                                borderRadius: 12,
                            }}
                        >
                            <Text style={{ color: "white", textAlign: "center", fontWeight: "900" }}>
                                {saving ? "Kaydediliyor..." : "Kaydet"}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={remove}
                            style={{ flex: 1, padding: 14, backgroundColor: "#ef4444", borderRadius: 12 }}
                        >
                            <Text style={{ color: "white", textAlign: "center", fontWeight: "900" }}>Quiz Sil</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={() => router.back()}
                        style={{ padding: 14, backgroundColor: "#6b7280", borderRadius: 12, marginTop: 10 }}
                    >
                        <Text style={{ color: "white", textAlign: "center", fontWeight: "900" }}>Geri</Text>
                    </Pressable>
                </>
            )}
        </View>
    );
}
