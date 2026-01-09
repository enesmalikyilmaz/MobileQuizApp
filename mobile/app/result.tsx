import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function Result() {
    const params = useLocalSearchParams();
    const room = (params.room as string) || "";
    const scoresJson = (params.scores as string) || "[]";

    let scores: { id: string; name: string; score: number }[] = [];
    try {
        scores = JSON.parse(scoresJson);
    } catch {
        scores = [];
    }

    return (
        <View style={{ flex: 1, padding: 24, backgroundColor: "white", justifyContent: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
                Sonuçlar
            </Text>

            <Text style={{ fontSize: 12, marginBottom: 12 }}>
                Oda: {room}
            </Text>

            {scores.length === 0 ? (
                <Text>Skor bulunamadý.</Text>
            ) : (
                <View style={{ marginBottom: 16 }}>
                    {scores.map((s, idx) => (
                        <Text key={s.id} style={{ fontSize: 16, marginBottom: 6 }}>
                            {idx + 1}. {s.name} — {s.score}
                        </Text>
                    ))}
                </View>
            )}

            <Pressable
                onPress={() => router.replace("/lobby")}
                style={{ padding: 12, backgroundColor: "#16a34a", borderRadius: 8, marginBottom: 10 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>
                    Lobby'ye Dön
                </Text>
            </Pressable>

            <Pressable
                onPress={() => router.replace("/(tabs)")}
                style={{ padding: 12, backgroundColor: "#6b7280", borderRadius: 8 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>
                    Ana Sayfa
                </Text>
            </Pressable>
        </View>
    );
}