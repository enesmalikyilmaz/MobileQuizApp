import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="explore" options={{ title: "Explore" }} />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
            <Tabs.Screen name="history" options={{ title: "History" }} />
            <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard" }} />

        </Tabs>
    );
}