import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";
const BG = "#0B0F1A";

type WorkoutLog = {
    id: string;
    title: string;
    workout_date: string;
    total_duration_mins: number;
    total_sets: number;
    calories_burned: number;
    created_at?: string;
};

export default function WorkoutHistory() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<WorkoutLog[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    async function loadHistory() {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser();

            if (userErr) throw userErr;
            if (!user) return;

            const { data, error } = await supabase
                .from("workout_logs")
                .select("id,title,workout_date,total_duration_mins,total_sets,calories_burned,created_at")
                .eq("user_id", user.id)
                .order("workout_date", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;
            setLogs((data || []) as WorkoutLog[]);
        } catch (e) {
            console.log("loadHistory error", e);
        } finally {
            setLoading(false);
        }
    }

    const groupedLogs = useMemo(() => {
        const groups: Record<string, WorkoutLog[]> = {};

        logs.forEach((log) => {
            const dateKey = log.workout_date;
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(log);
        });

        return groups;
    }, [logs]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));
    }, [groupedLogs]);

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Workout History</Text>

                    <View style={styles.iconBtn} />
                </View>

                {loading ? (
                    <View style={{ paddingVertical: 40, alignItems: "center" }}>
                        <ActivityIndicator color={ACCENT} />
                    </View>
                ) : sortedDates.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>No workouts yet</Text>
                        <Text style={{ color: MUTED, marginTop: 8 }}>Your logged workouts will appear here.</Text>
                    </View>
                ) : (
                    sortedDates.map((date) => (
                        <View key={date} style={{ marginTop: 16 }}>
                            <Text style={styles.sectionTitle}>{formatDate(date)}</Text>

                            <View style={{ gap: 12 }}>
                                {groupedLogs[date].map((log) => (
                                    <View key={log.id} style={styles.card}>
                                        <View style={styles.cardRow}>
                                            <View style={styles.leftIcon}>
                                                <Ionicons name="barbell-outline" size={18} color={ACCENT} />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.cardTitle}>{log.title}</Text>
                                                <Text style={styles.cardMeta}>
                                                    ⏱ {log.total_duration_mins} mins   •   🔥 {log.calories_burned} kcal   •   💪 {log.total_sets} sets
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

const styles = {
    headerRow: {
        marginTop: 40,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
    },
    headerTitle: {
        color: "white",
        fontWeight: "900" as const,
        fontSize: 16,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
    },
    sectionTitle: {
        fontSize: 18,
        color: ACCENT,
        fontWeight: "900" as const,
        marginBottom: 10,
    },
    emptyCard: {
        marginTop: 20,
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 18,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center" as const,
    },
    card: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    cardRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 12,
    },
    leftIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: "rgba(255,77,45,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,77,45,0.25)",
    },
    cardTitle: {
        color: "white",
        fontWeight: "900" as const,
        fontSize: 16,
    },
    cardMeta: {
        color: "#C7CFDD",
        fontSize: 12,
        marginTop: 4,
        opacity: 0.9,
    },
};