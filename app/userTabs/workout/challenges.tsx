import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function Challenges() {
    return (
        <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.hello}>Challenges</Text>
                        <Text style={styles.welcome}>Compete, earn badges, climb ranks.</Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn}>
                        <Ionicons name="information-circle-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Active</Text>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.rowCard}
                    onPress={() => router.push("/userTabs/workout/pushup")}
                >
                    <View style={styles.leftIcon}>
                        <Ionicons name="fitness-outline" size={18} color={ACCENT} />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Push-up Challenge</Text>
                        <Text style={styles.rowMeta}>Camera counts your reps • 60 seconds</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#C7CFDD" />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.primaryBtn, { marginTop: 14 }]}
                    onPress={() => router.push("/userTabs/workout/leaderboard")}
                >
                    <Ionicons name="trophy-outline" size={18} color="white" />
                    <Text style={styles.primaryText}>View Leaderboard</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = {
    headerCard: {
        marginTop: 40,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        padding: 14,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        gap: 10,
    },
    hello: { color: ACCENT, fontWeight: "900" as const, fontSize: 18 },
    welcome: { color: MUTED, marginTop: 2, fontSize: 12 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: "transparent",
    },
    sectionTitle: {
        fontSize: 18,
        color: ACCENT,
        fontWeight: "900" as const,
        marginTop: 14,
        marginBottom: 8,
    },
    rowCard: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 12,
        borderWidth: 1,
        borderColor: BORDER,
    },
    leftIcon: {
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    rowTitle: { color: "white", fontWeight: "900" as const, fontSize: 16 },
    rowMeta: { color: "#C7CFDD", fontSize: 12, marginTop: 4, opacity: 0.9 },

    primaryBtn: {
        height: 56,
        borderRadius: 999,
        backgroundColor: ACCENT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 10,
    },
    primaryText: { color: "white", fontWeight: "900" as const, fontSize: 16 },
};