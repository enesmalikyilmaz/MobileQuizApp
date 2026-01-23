import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: "Ana Sayfa" }} />
            <Tabs.Screen name="profile" options={{ title: "Profil" }} />
            <Tabs.Screen name="history" options={{ title: "Geçmiş" }} />
            <Tabs.Screen name="leaderboard" options={{ title: "Lider Tablosu" }} />

        </Tabs>
    );
}