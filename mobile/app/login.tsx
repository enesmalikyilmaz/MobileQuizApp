import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postJson } from "../src/services/api";

export default function Login() {
    const [email, setEmail] = useState("enes@gmail.com");
    const [password, setPassword] = useState("123456");
    const [msg, setMsg] = useState("");

    const onLogin = async () => {
        try {
            setMsg("");
            const data = await postJson<{ token: string }>("/auth/login", {
                email,
                password,
            });

            await AsyncStorage.setItem("token", data.token);
            router.replace("/(tabs)/profile");
        } catch (e: any) {
            setMsg("Hata: " + (e.message || e));
        }
    };

    return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Giriş Yap</Text>

            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Şifre"
                secureTextEntry
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

            {!!msg && <Text style={{ color: "red", marginBottom: 10 }}>{msg}</Text>}

            <Pressable onPress={onLogin} style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 8 }}>
                <Text style={{ color: "white", textAlign: "center" }}>Giriş Yap</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/register")} style={{ padding: 12, marginTop: 10 }}>
                <Text style={{ textAlign: "center" }}>Kayıt ol</Text>
            </Pressable>
        </View>
    );
}