import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";
const BG = "#0B0F1A";
const WHITE = "#FFFFFF";

type Workout = {
    id: string;
    title: string;
    category: string | null;
    difficulty: string | null;
    duration_mins: number | null;
    kcal_estimate: number | null;
    tips: string | null;
    video_url: string | null;
};

type WorkoutExercise = {
    id: string;
    name: string;
    sets: string | null;
    reps: string | null;
    sort_order: number;
};

export default function WorkoutDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const workoutId = String(id || "");

    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

    useEffect(() => {
        const run = async () => {
            if (!workoutId) return;

            try {
                setLoading(true);

                const { data: workoutData, error: workoutErr } = await supabase
                    .from("workouts")
                    .select("id,title,category,difficulty,duration_mins,kcal_estimate,tips,video_url")
                    .eq("id", workoutId)
                    .single();

                if (workoutErr) throw workoutErr;

                const { data: exerciseData, error: exErr } = await supabase
                    .from("workout_exercises")
                    .select("id,name,sets,reps,sort_order")
                    .eq("workout_id", workoutId)
                    .order("sort_order", { ascending: true });

                if (exErr) throw exErr;

                setWorkout(workoutData as Workout);
                setExercises((exerciseData || []) as WorkoutExercise[]);
            } catch (e: any) {
                Alert.alert("Error", e?.message || "Failed to load workout details.");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [workoutId]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={ACCENT} />
            </View>
        );
    }

    if (!workout) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "white" }}>Workout not found.</Text>
            </View>
        );
    }

    const meta = `${workout.category ?? "Workout"} • ${workout.difficulty ?? "—"} • ${workout.duration_mins ?? 0} mins`;

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Workout Details</Text>

                    <TouchableOpacity activeOpacity={0.9} style={styles.backBtn}>
                        <Ionicons name="bookmark-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroTitle}>{workout.title}</Text>
                            <Text style={styles.heroMeta}>{meta}</Text>
                        </View>

                        <View style={styles.iconBubble}>
                            <Ionicons name="barbell-outline" size={20} color={ACCENT} />
                        </View>
                    </View>

                    <View style={styles.heroStatsRow}>
                        <MiniPill icon="speedometer-outline" label="Level" value={workout.difficulty ?? "—"} />
                        <MiniPill icon="flame-outline" label="Calories" value={`${workout.kcal_estimate ?? 0} kcal`} />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>

                        <TouchableOpacity
                            style={[styles.primaryBtn, { flex: 1 }]}
                            activeOpacity={0.9}
                            onPress={async () => {
                                if (!workout?.video_url) {
                                    Alert.alert("No video", "No tutorial video available for this workout yet.");
                                    return;
                                }

                                const supported = await Linking.canOpenURL(workout.video_url);
                                if (!supported) {
                                    Alert.alert("Invalid link", "This video link cannot be opened.");
                                    return;
                                }

                                await Linking.openURL(workout.video_url);
                            }}
                        >
                            <Ionicons name="videocam-outline" size={18} color={WHITE} />
                            <Text style={styles.primaryText}>Watch Video</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Exercises</Text>

                <View style={styles.bigCard}>
                    {exercises.length === 0 ? (
                        <Text style={{ color: MUTED }}>No exercises found for this workout.</Text>
                    ) : (
                        exercises.map((ex, idx) => (
                            <View
                                key={ex.id}
                                style={[
                                    styles.exerciseRow,
                                    { borderBottomWidth: idx === exercises.length - 1 ? 0 : 1 },
                                ]}
                            >
                                <View style={styles.exerciseIcon}>
                                    <Ionicons name="checkmark-circle-outline" size={18} color={ACCENT} />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.exerciseName}>{ex.name}</Text>
                                    <Text style={styles.exerciseMeta}>
                                        Sets: {ex.sets ?? "-"} • Reps/Time: {ex.reps ?? "-"}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <Text style={styles.sectionTitle}>Tips</Text>
                <View style={styles.bigCard}>
                    <Text style={{ color: "white", fontWeight: "900" as const }}>Form matters more than speed.</Text>
                    <Text style={{ color: MUTED, marginTop: 8 }}>
                        {workout.tips || "Keep your core tight, breathe steadily, and stop if you feel sharp pain."}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function MiniPill({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <View style={styles.miniPill}>
            <Ionicons name={icon} size={14} color={ACCENT} />
            <Text style={{ color: MUTED, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: "white", fontWeight: "900" as const, fontSize: 12 }}>{value}</Text>
        </View>
    );
}

const styles = {
    headerRow: {
        marginTop: 40,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerTitle: {
        color: "white",
        fontWeight: "900" as const,
        fontSize: 16,
    },
    heroCard: {
        marginTop: 14,
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    heroTitle: { color: "white", fontWeight: "900" as const, fontSize: 20 },
    heroMeta: { color: "#C7CFDD", marginTop: 4, fontSize: 12, opacity: 0.9 },
    iconBubble: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: "rgba(255,77,45,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,77,45,0.25)",
        marginLeft: 12,
    },
    heroStatsRow: {
        flexDirection: "row" as const,
        gap: 10,
        marginTop: 12,
    },
    miniPill: {
        flex: 1,
        height: 40,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 8,
    },
    primaryBtn: {
        height: 54,
        borderRadius: 16,
        backgroundColor: ACCENT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 8,
    },
    primaryText: { color: "white", fontWeight: "900" as const, fontSize: 14 },
    secondaryBtn: {
        height: 54,
        borderRadius: 16,
        backgroundColor: "transparent",
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 8,
        borderWidth: 1.5,
        borderColor: ACCENT,
    },
    secondaryText: { color: "#FFD3CA", fontWeight: "900" as const, fontSize: 14 },
    sectionTitle: {
        fontSize: 18,
        color: ACCENT,
        fontWeight: "900" as const,
        marginTop: 14,
        marginBottom: 8,
    },
    bigCard: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    exerciseRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 12,
        paddingVertical: 12,
        borderBottomColor: BORDER,
    },
    exerciseIcon: {
        width: 36,
        height: 36,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    exerciseName: { color: "white", fontWeight: "900" as const, fontSize: 14 },
    exerciseMeta: { color: MUTED, fontSize: 12, marginTop: 4 },
};
