import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { postJson } from "../src/services/api";

export default function Register() {
    const [email, setEmail] = useState("enes@gmail.com");
    const [password, setPassword] = useState("123456");
    const [name, setName] = useState("Enes");
    const [msg, setMsg] = useState("");

    const onRegister = async () => {
        try {
            setMsg("");
            await postJson("/auth/register", { email, password, name });
            router.replace("/login");
        } catch (e: any) {
            setMsg("Hata: " + (e.message || e));
        }
    };

    return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: "white" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Register</Text>

            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ýsim"
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

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
                placeholder="Þifre"
                secureTextEntry
                style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 10 }}
            />

            {!!msg && <Text style={{ color: "red", marginBottom: 10 }}>{msg}</Text>}

            <Pressable onPress={onRegister} style={{ padding: 12, backgroundColor: "#16a34a", borderRadius: 8 }}>
                <Text style={{ color: "white", textAlign: "center" }}>Kayýt Ol</Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/login")} style={{ padding: 12, marginTop: 10 }}>
                <Text style={{ textAlign: "center" }}>Giriþe dön</Text>
            </Pressable>
        </View>
    );
}