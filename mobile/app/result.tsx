import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function Result() {
    const params = useLocalSearchParams();
    const room = (params.room as string) || "";

    let scores: any[] = [];
    try {
        scores = JSON.parse((params.scores as string) || "[]");
    } catch {
        scores = [];
    }

    // garanti sıralama
    scores.sort((a, b) => (b.score || 0) - (a.score || 0));

    return (
        <View style={{ flex: 1, padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Sonuçlar</Text>
            <Text style={{ fontSize: 12, marginBottom: 16 }}>Oda: {room}</Text>

            {scores.length === 0 ? (
                <Text>Skor verisi yok.</Text>
            ) : (
                <View style={{ marginBottom: 18 }}>
                    {scores.map((s, i) => (
                        <View
                            key={s.id || i}
                            style={{
                                padding: 12,
                                borderWidth: 1,
                                borderColor: "#ddd",
                                borderRadius: 10,
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "700" }}>
                                {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}
                                {i + 1}. {s.name}
                            </Text>
                            <Text>Skor: {s.score}</Text>
                        </View>
                    ))}
                </View>
            )}

            <Pressable
                onPress={() => router.replace("/(tabs)")}
                style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 8 }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>Home’a dön</Text>
            </Pressable>
        </View>
    );
}
