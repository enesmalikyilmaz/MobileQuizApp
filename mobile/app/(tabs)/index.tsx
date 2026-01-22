import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    Pressable,
    TextInput,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getJson } from "../../src/services/api";
import { useFocusEffect } from "expo-router";



type QuizItem = {
    _id: string;
    title: string;
    description?: string;
    category?: string;
};

type MeResponse = {
    user: {
        name: string;
        email: string;
        isAdmin?: boolean;
    };
};

const CATEGORIES = ["Hepsi", "Genel", "Genel Kültür", "Bilim", "Tarih", "Spor"];

function Chip({
    label,
    active,
    onPress,
}: {
    label: string;
    active?: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? "#2563eb" : "#e5e7eb",
                backgroundColor: active ? "#2563eb" : "white",
                marginRight: 8,
            }}
        >
            <Text style={{ color: active ? "white" : "#111827", fontWeight: "600" }}>
                {label}
            </Text>
        </Pressable>
    );
}

function QuizCard({
    item,
    onPress,
}: {
    item: QuizItem;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                borderWidth: 1,
                borderColor: "#eef2f7",
                backgroundColor: "white",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                        {item.title}
                    </Text>
                    {!!item.description && (
                        <Text style={{ marginTop: 6, color: "#475569" }} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                </View>

                <View
                    style={{
                        alignSelf: "flex-start",
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        backgroundColor: "#f1f5f9",
                    }}
                >
                    <Text style={{ color: "#0f172a", fontWeight: "700", fontSize: 12 }}>
                        {item.category || "Genel"}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

export default function TabHome() {
    const [token, setToken] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [msg, setMsg] = useState("");

    const [category, setCategory] = useState("Hepsi");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return quizzes.filter((q) => {
            const catOk =
                category === "Hepsi"
                    ? true
                    : normCat(q.category || "Genel") === normCat(category);
            const text = `${q.title || ""} ${q.description || ""}`.toLowerCase();
            const searchOk = !s ? true : text.includes(s);
            return catOk && searchOk;
        });
    }, [quizzes, category, search]);

    function normCat(v?: string) {
        return (v || "")
            .trim()
            .toLocaleLowerCase("tr-TR")
            .replace(/\s+/g, " "); // çoklu boşluğu tek yapmak için
    }


    async function loadMeAndToken() {
        const t = await AsyncStorage.getItem("token");
        setToken(t);

        if (!t) {
            setIsAdmin(false);
            return;
        }

        // Admin durumunu göstermek için
        try {
            const me = await getJson<MeResponse>("/me", t);
            setIsAdmin(!!me.user?.isAdmin);
        } catch {
            setIsAdmin(false);
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            loadMeAndToken();
            loadQuizzes();
        }, [])
    );


    async function loadQuizzes() {
        try {
            setMsg("");
            const list = await getJson<QuizItem[]>("/quizzes");
            setQuizzes(list);
        } catch (e: any) {
            setMsg("Quiz listesi alınamadı: " + (e?.message || String(e)));
        }
    }

    async function initialLoad() {
        try {
            setLoading(true);
            await loadMeAndToken();
            await loadQuizzes();
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        initialLoad();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMeAndToken();
        await loadQuizzes();
        setRefreshing(false);
    };

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        setToken(null);
        setIsAdmin(false);
        router.replace("/login");
    };

    const goLobby = (quizId: string) => {
        router.push(`/lobby?quizId=${encodeURIComponent(quizId)}`);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 16 }}>
            <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 24, fontWeight: "900", color: "#0f172a" }}>Ana Sayfa</Text>
                <Text style={{ marginTop: 4, color: "#64748b" }}>
                    Oturum: {token ? "✅ Aktif" : "❌ Kapalı"}
                </Text>
            </View>

            {!!msg && (
                <Text style={{ marginBottom: 10, color: "#ef4444", fontWeight: "700" }}>
                    {msg}
                </Text>
            )}

            <View
                style={{
                    backgroundColor: "white",
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#eef2f7",
                    marginBottom: 12,
                }}
            >
                <Text style={{ fontWeight: "800", color: "#0f172a", marginBottom: 8 }}>
                    Kategori
                </Text>

                <FlatList
                    horizontal
                    data={CATEGORIES}
                    keyExtractor={(x) => x}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Chip label={item} active={item === category} onPress={() => setCategory(item)} />
                    )}
                />

                <Text style={{ fontWeight: "800", color: "#0f172a", marginTop: 12, marginBottom: 8 }}>
                    Ara
                </Text>

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Quiz adı / açıklama..."
                    placeholderTextColor="#94a3b8"
                    style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: "white",
                    }}
                />

                {isAdmin && (
                    <Pressable
                        onPress={() => router.push("/admin-quizzes")}
                        style={{
                            marginTop: 12,
                            padding: 12,
                            backgroundColor: "#111827",
                            borderRadius: 12,
                        }}
                    >
                        <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>
                            Admin Panel (Quiz Yönetimi)
                        </Text>
                    </Pressable>
                )}
            </View>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ marginTop: 20 }}>
                        <ActivityIndicator />
                        <Text style={{ marginTop: 10, color: "#64748b" }}>Yükleniyor...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={(x) => x._id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListHeaderComponent={
                            <Text style={{ fontWeight: "900", color: "#0f172a", marginBottom: 10 }}>
                                Quiz Seç
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <QuizCard item={item} onPress={() => goLobby(item._id)} />
                        )}
                        ListEmptyComponent={
                            <Text style={{ color: "#64748b" }}>Bu filtrede quiz yok.</Text>
                        }
                    />
                )}
            </View>

            <Pressable
                onPress={logout}
                style={{
                    padding: 14,
                    backgroundColor: "#ef4444",
                    borderRadius: 14,
                    marginTop: 12,
                }}
            >
                <Text style={{ color: "white", textAlign: "center", fontWeight: "900" }}>
                    Çıkış Yap
                </Text>
            </Pressable>
        </View>
    );
}
