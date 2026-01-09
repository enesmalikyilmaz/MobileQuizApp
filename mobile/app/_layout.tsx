import { Stack, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const boot = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const target = token ? "/(tabs)" : "/login";

                if (pathname !== target) {
                    requestAnimationFrame(() => router.replace(target));
                }
            } catch {
                requestAnimationFrame(() => router.replace("/login"));
            } finally {
                setLoading(false);
            }
        };

        boot();
        // sadece ilk açýlýþta çalýþsýn
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Stack>
                <Stack.Screen name="login" options={{ title: "Login" }} />
                <Stack.Screen name="register" options={{ title: "Register" }} />
                <Stack.Screen name="lobby" options={{ title: "Lobby" }} />
                <Stack.Screen name="game" options={{ title: "Game" }} />
                <Stack.Screen name="result" options={{ title: "Result" }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>

            {loading && (
                <View
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "black",
                    }}
                >
                    <ActivityIndicator />
                </View>
            )}
        </>
    );
}