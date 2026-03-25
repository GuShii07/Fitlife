import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ORANGE = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerHome() {
    const [loading, setLoading] = useState(true);
    const [approvedTrainerCount, setApprovedTrainerCount] = useState(0);
    const [pendingRequestCount, setPendingRequestCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            loadTrainerSummary();
        }, [])
    );

    async function loadTrainerSummary() {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser();

            if (userErr) throw userErr;
            if (!user) {
                setApprovedTrainerCount(0);
                setPendingRequestCount(0);
                return;
            }

            const { data: approvedRows, error: approvedErr } = await supabase
                .from("user_trainers")
                .select("id")
                .eq("user_id", user.id)
                .eq("status", "approved");

            if (approvedErr) throw approvedErr;

            const { data: pendingRows, error: pendingErr } = await supabase
                .from("user_trainers")
                .select("id")
                .eq("user_id", user.id)
                .eq("status", "pending");

            if (pendingErr) throw pendingErr;

            setApprovedTrainerCount(approvedRows?.length ?? 0);
            setPendingRequestCount(pendingRows?.length ?? 0);
        } catch (e) {
            console.log("loadTrainerSummary error", e);
            setApprovedTrainerCount(0);
            setPendingRequestCount(0);
        } finally {
            setLoading(false);
        }
    }

    const hasTrainer = approvedTrainerCount > 0;

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Trainer</Text>
                <Text style={styles.sub}>Find, hire, and manage your coaching.</Text>

                {loading ? (
                    <View style={styles.summaryCard}>
                        <ActivityIndicator color={ORANGE} />
                        <Text style={styles.summaryText}>Loading trainer info...</Text>
                    </View>
                ) : (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryValue}>{approvedTrainerCount}</Text>
                            <Text style={styles.summaryLabel}>Active Trainers</Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryValue}>{pendingRequestCount}</Text>
                            <Text style={styles.summaryLabel}>Pending Requests</Text>
                        </View>
                    </View>
                )}

                <Card
                    icon="people-outline"
                    title="Browse Trainers"
                    desc="Search by specialty, price, and location"
                    onPress={() => router.push("/userTabs/trainer/browse")}
                />

                <Card
                    icon="paper-plane-outline"
                    title="Requests"
                    desc={
                        pendingRequestCount > 0
                            ? `${pendingRequestCount} pending request(s)`
                            : "View pending, approved, or declined requests"
                    }
                    onPress={() => router.push("/userTabs/trainer/requests")}
                />

                {hasTrainer && (
                    <Card
                        icon="person-circle-outline"
                        title="My Trainers"
                        desc={`You have ${approvedTrainerCount} active trainer(s)`}
                        onPress={() => router.push("/userTabs/trainer/my-trainer")}
                    />
                )}
                {hasTrainer && (
                    <Card
                        icon="chatbubble-ellipses-outline"
                        title="Chats"
                        desc={
                            hasTrainer
                                ? "Message your trainer(s)"
                                : "Chat will be available after a trainer is approved"
                        }
                        onPress={() => { }}
                    />)}
            </ScrollView>
        </View>
    );
}

function Card({ icon, title, desc, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
            <Ionicons name={icon} size={24} color={ORANGE} />
            <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    title: { color: "white", fontSize: 28, fontWeight: "900", marginTop: 40, marginBottom: 6 },
    sub: { color: MUTED, marginBottom: 18 },

    summaryCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 14,
    },
    summaryBox: {
        flex: 1,
        alignItems: "center",
    },
    summaryValue: {
        color: ORANGE,
        fontWeight: "900",
        fontSize: 24,
    },
    summaryLabel: {
        color: MUTED,
        marginTop: 4,
        fontSize: 12,
    },
    summaryDivider: {
        width: 1,
        height: 36,
        backgroundColor: BORDER,
        marginHorizontal: 12,
    },
    summaryText: {
        color: MUTED,
        marginLeft: 10,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 14,
    },
    cardTitle: { color: "white", fontWeight: "900", fontSize: 16 },
    cardDesc: { color: MUTED, marginTop: 4 },
});