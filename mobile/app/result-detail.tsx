import { View, Text, ScrollView, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { getJson } from "../src/services/api";

export default function ResultDetail() {
    const params = useLocalSearchParams();
    const id = (params.id as string) || "";

    const [data, setData] = useState<any>(null);
    const [msg, setMsg] = useState("");

    async function load() {
        try {
            setMsg("");
            const r = await getJson<any>(`/results/${id}`);
            setData(r);
        } catch (e: any) {
            setMsg("Hata: " + (e?.message || String(e)));
            setData(null);
        }
    }

    useEffect(() => { if (id) load(); }, [id]);

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>Sonuç Detayı</Text>

            {!!msg && <Text style={{ color: "red", marginBottom: 10 }}>{msg}</Text>}

            {data ? (
                <ScrollView>
                    <Text>Oda: {data.roomCode}</Text>
                    <Text>Quiz: {data?.quizId?.title ?? "-"}</Text>
                    <Text>Süre: {data.durationSec ?? 0} sn</Text>
                    <Text>Toplam Soru: {data.totalQuestions ?? 0}</Text>

                    <Text style={{ marginTop: 12, fontWeight: "700" }}>Skorlar</Text>
                    {(data.scores || []).map((s: any, i: number) => (
                        <View key={String(i)} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                            <Text style={{ fontWeight: "700" }}>{s.name}</Text>
                            <Text>Skor: {s.score ?? 0}</Text>
                            <Text>Doğru: {s.correctCount ?? 0} / Yanlış: {s.wrongCount ?? 0}</Text>
                            <Text>Elendi mi: {s.eliminated ? "Evet" : "Hayır"}</Text>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <Text>Yükleniyor...</Text>
            )}

            <Pressable
                onPress={() => router.back()}
                style={{ padding: 12, backgroundColor: "#6b7280", borderRadius: 8, marginTop: 14 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Geri</Text>
            </Pressable>
        </View>
    );
}