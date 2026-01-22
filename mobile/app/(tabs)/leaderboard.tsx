import { View, Text, Pressable, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { getJson } from "../../src/services/api";

type Item = { _id?: string; name: string; totalScore?: number; score?: number };

export default function Leaderboard() {
    const [mode, setMode] = useState<"all-time" | "weekly" | "monthly">("all-time");
    const [list, setList] = useState<Item[]>([]);
    const [msg, setMsg] = useState("");

    async function load(m: typeof mode) {
        try {
            setMsg("");
            setList([]);
            const data = await getJson<Item[]>(`/leaderboard/${m}`);
            setList(data || []);
        } catch (e: any) {
            setMsg("Hata: " + (e?.message || String(e)));
        }
    }

    useEffect(() => {
        load(mode);
    }, [mode]);

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "white" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
                Lider Tablosu
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <Pressable
                    onPress={() => setMode("all-time")}
                    style={{ padding: 10, backgroundColor: mode === "all-time" ? "#2563eb" : "#e5e7eb", borderRadius: 8 }}
                >
                    <Text style={{ color: mode === "all-time" ? "white" : "black" }}>Tüm Zamanlar</Text>
                </Pressable>

                <Pressable
                    onPress={() => setMode("weekly")}
                    style={{ padding: 10, backgroundColor: mode === "weekly" ? "#2563eb" : "#e5e7eb", borderRadius: 8 }}
                >
                    <Text style={{ color: mode === "weekly" ? "white" : "black" }}>Haftalık</Text>
                </Pressable>

                <Pressable
                    onPress={() => setMode("monthly")}
                    style={{ padding: 10, backgroundColor: mode === "monthly" ? "#2563eb" : "#e5e7eb", borderRadius: 8 }}
                >
                    <Text style={{ color: mode === "monthly" ? "white" : "black" }}>Aylık</Text>
                </Pressable>
            </View>

            {!!msg && <Text style={{ color: "red", marginBottom: 10 }}>{msg}</Text>}

            <ScrollView>
                {list.map((u, i) => (
                    <View
                        key={u._id || String(i)}
                        style={{ padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, marginBottom: 8 }}
                    >
                        <Text style={{ fontWeight: "700" }}>
                            {i + 1}. {u.name}
                        </Text>

                        {/* all-time totalScore, weekly/monthly score */}
                        <Text>
                            Puan: {u.totalScore ?? u.score ?? 0}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}