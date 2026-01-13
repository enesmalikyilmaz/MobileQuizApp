import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJson, putJson } from "../../src/services/api";

type MeResponse = {
    user: {
        name: string;
        email: string;
        city?: string;
        country?: string;
        avatarUrl?: string;
        stats?: {
            totalGames?: number;
            totalScore?: number;
            bestScore?: number;
        };
        achievements?: string[];
        createdAt?: string;
    };
};

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [stats, setStats] = useState<{ totalGames: number; totalScore: number; bestScore: number }>({
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
    });

    const [achievements, setAchievements] = useState<string[]>([]);
    const [msg, setMsg] = useState("");

    async function loadProfile() {
        try {
            setMsg("");
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setMsg("Token bulunamadı. Lütfen tekrar login ol.");
                return;
            }

            const data = await getJson<MeResponse>("/me", token);

            setName(data.user.name || "");
            setEmail(data.user.email || "");

            setCity(data.user.city || "");
            setCountry(data.user.country || "");
            setAvatarUrl(data.user.avatarUrl || "");

            setStats({
                totalGames: data.user.stats?.totalGames || 0,
                totalScore: data.user.stats?.totalScore || 0,
                bestScore: data.user.stats?.bestScore || 0,
            });

            setAchievements(data.user.achievements || []);
        } catch (e: any) {
            setMsg("Profil yüklenemedi: " + (e?.message || String(e)));
        } finally {
            setLoading(false);
        }
    }

    async function saveProfile() {
        try {
            setMsg("");
            setSaving(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setMsg("Token bulunamadı. Lütfen tekrar login ol.");
                return;
            }

            await putJson("/me", { city, country, avatarUrl }, token);
            setMsg("✅ Profil kaydedildi");
        } catch (e: any) {
            setMsg("Kaydetme hatası: " + (e?.message || String(e)));
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    return (
        <View style={{ flex: 1, padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Profile</Text>

            {loading ? (
                <View style={{ marginTop: 20 }}>
                    <ActivityIndicator />
                    <Text style={{ marginTop: 10 }}>Yükleniyor...</Text>
                </View>
            ) : (
                <>
                    {!!msg && (
                        <Text style={{ marginBottom: 12, color: msg.startsWith("✅") ? "green" : "red" }}>
                            {msg}
                        </Text>
                    )}

                    <Text style={{ fontWeight: "700", marginBottom: 4 }}>Ad</Text>
                    <Text style={{ marginBottom: 10 }}>{name}</Text>

                    <Text style={{ fontWeight: "700", marginBottom: 4 }}>E-posta</Text>
                    <Text style={{ marginBottom: 14 }}>{email}</Text>

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Şehir</Text>
                    <TextInput
                        value={city}
                        onChangeText={setCity}
                        placeholder="Örn: Bursa"
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
                    />

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Ülke</Text>
                    <TextInput
                        value={country}
                        onChangeText={setCountry}
                        placeholder="Örn: Türkiye"
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
                    />

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Avatar URL</Text>
                    <TextInput
                        value={avatarUrl}
                        onChangeText={setAvatarUrl}
                        placeholder="https://..."
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 14 }}
                    />

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>İstatistikler</Text>
                    <Text>Toplam oyun: {stats.totalGames}</Text>
                    <Text>Toplam skor: {stats.totalScore}</Text>
                    <Text>En iyi skor: {stats.bestScore}</Text>

                    <Text style={{ fontWeight: "700", marginTop: 14, marginBottom: 6 }}>Başarılar</Text>
                    {achievements.length === 0 ? (
                        <Text style={{ color: "#6b7280" }}>Henüz başarı yok.</Text>
                    ) : (
                        achievements.map((a, i) => <Text key={i}>• {a}</Text>)
                    )}

                    <Pressable
                        onPress={saveProfile}
                        disabled={saving}
                        style={{
                            padding: 12,
                            backgroundColor: saving ? "#9ca3af" : "#2563eb",
                            borderRadius: 8,
                            marginTop: 18,
                        }}
                    >
                        <Text style={{ color: "white", textAlign: "center" }}>
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={loadProfile}
                        style={{ padding: 12, backgroundColor: "#111827", borderRadius: 8, marginTop: 10 }}
                    >
                        <Text style={{ color: "white", textAlign: "center" }}>Yenile</Text>
                    </Pressable>
                </>
            )}
        </View>
    );
}