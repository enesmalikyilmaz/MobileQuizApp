import { View, Text, Pressable, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { getJson } from "../../src/services/api";

type ResultItem = {
    _id: string;
    roomCode: string;
    durationSec?: number;
    totalQuestions?: number;
    winner?: { name?: string; score?: number };
    createdAt?: string;
    quizTitle?: string;
};

export default function History() {
    const [list, setList] = useState<ResultItem[]>([]);
    const [msg, setMsg] = useState("");

    async function load() {
        try {
            setMsg("");
            const data = await getJson<ResultItem[]>("/results");
            setList(data || []);
        } catch (e: any) {
            setMsg("Hata: " + (e?.message || String(e)));
            setList([]);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
                Oyun Geçmişi
            </Text>

            {!!msg && <Text style={{ color: "red", marginBottom: 10 }}>{msg}</Text>}


            <Pressable
                onPress={load}
                style={{ padding: 10, backgroundColor: "#111827", borderRadius: 8, marginBottom: 12 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Yenile</Text>
            </Pressable>

            <ScrollView>
                {list.map((r) => (
                    <Pressable
                        key={r._id}
                        onPress={() => router.push(`/result-detail?id=${encodeURIComponent(r._id)}`)}
                        style={{
                            padding: 12,
                            borderWidth: 1,
                            borderColor: "#ddd",
                            borderRadius: 10,
                            marginBottom: 10
                        }}
                    >
                        <Text style={{ fontWeight: "700" }}>Oda: {r.roomCode}</Text>
                        <Text>Quiz: {r.quizTitle ?? "-"}</Text>
                        <Text>Toplam Soru: {r.totalQuestions ?? "-"}</Text>
                        <Text>Süre: {r.durationSec ?? 0} sn</Text>
                        <Text>Kazanan: {r.winner?.name ?? "-"} ({r.winner?.score ?? 0})</Text>
                        {!!r.createdAt && <Text style={{ fontSize: 12, color: "#6b7280" }}>{r.createdAt}</Text>}
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}
