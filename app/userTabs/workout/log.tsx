import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";
const BG = "#0B0F1A";

type WorkoutRow = {
    id: string;
    title: string;
    category: string | null;
    difficulty: string | null;
    duration_mins: number | null;
    kcal_estimate: number | null;
};

export default function LogWorkout() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
    const [query, setQuery] = useState("");
    const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRow | null>(null);

    const [duration, setDuration] = useState("");
    const [dateText, setDateText] = useState(() => new Date().toISOString().slice(0, 10));

    useEffect(() => {
        loadWorkouts();
    }, []);

    async function loadWorkouts() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("workouts")
                .select("id,title,category,difficulty,duration_mins,kcal_estimate")
                .eq("is_active", true)
                .order("title", { ascending: true });

            if (error) throw error;
            setWorkouts((data || []) as WorkoutRow[]);
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to load workouts.");
        } finally {
            setLoading(false);
        }
    }

    const filteredWorkouts = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return workouts;
        return workouts.filter((w) => w.title.toLowerCase().includes(q));
    }, [query, workouts]);

    const durationNum = Number(duration || "0");
    const caloriesBurned = useMemo(() => {
        if (!selectedWorkout) return 0;
        const baseDuration = Number(selectedWorkout.duration_mins || 0);
        const baseCalories = Number(selectedWorkout.kcal_estimate || 0);
        if (baseDuration <= 0 || baseCalories <= 0 || durationNum <= 0) return 0;

        const caloriesPerMin = baseCalories / baseDuration;
        return Math.round(durationNum * caloriesPerMin);
    }, [selectedWorkout, durationNum]);

    async function saveWorkout() {
        if (!selectedWorkout) {
            Alert.alert("Select workout", "Please choose a workout first.");
            return;
        }

        if (!durationNum || durationNum <= 0) {
            Alert.alert("Invalid duration", "Please enter a valid duration in minutes.");
            return;
        }

        try {
            setSaving(true);

            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser();

            if (userErr) throw userErr;
            if (!user) throw new Error("You must be logged in.");

            const { error } = await supabase.from("workout_logs").insert({
                user_id: user.id,
                workout_id: selectedWorkout.id,
                title: selectedWorkout.title,
                workout_type: "strength",
                workout_date: dateText,
                total_sets: 0,
                total_reps: 0,
                total_volume: 0,
                total_duration_mins: durationNum,
                calories_burned: caloriesBurned,
            });

            if (error) throw error;

            Alert.alert("Saved ✅", "Workout logged successfully.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert("Save failed", e?.message || "Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Log Workout</Text>

                    <View style={styles.iconBtn} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>SEARCH WORKOUT</Text>

                    <Text style={styles.label}>search</Text>
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="e.g., Push-ups, Squats, Plank"
                        placeholderTextColor="#6B7690"
                        style={styles.input}
                    />

                    {loading ? (
                        <View style={{ paddingVertical: 20, alignItems: "center" }}>
                            <ActivityIndicator color={ACCENT} />
                        </View>
                    ) : (
                        <View style={{ marginTop: 12, gap: 10 }}>
                            {filteredWorkouts.slice(0, 8).map((w) => {
                                const active = selectedWorkout?.id === w.id;
                                return (
                                    <TouchableOpacity
                                        key={w.id}
                                        activeOpacity={0.9}
                                        onPress={() => setSelectedWorkout(w)}
                                        style={[
                                            styles.workoutRow,
                                            active && {
                                                borderColor: ACCENT,
                                                backgroundColor: "rgba(255,77,45,0.12)",
                                            },
                                        ]}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.workoutTitle}>{w.title}</Text>
                                            <Text style={styles.workoutMeta}>
                                                {w.category ?? "Workout"} • {w.difficulty ?? "—"} • {w.duration_mins ?? 0} mins •{" "}
                                                {w.kcal_estimate ?? 0} kcal
                                            </Text>
                                        </View>

                                        {active && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>LOG DETAILS</Text>

                    <Text style={styles.label}>selected workout</Text>
                    <View style={styles.readonlyBox}>
                        <Text style={{ color: "white", fontWeight: "800" }}>
                            {selectedWorkout ? selectedWorkout.title : "No workout selected"}
                        </Text>
                    </View>

                    <Text style={[styles.label, { marginTop: 12 }]}>duration (mins)</Text>
                    <TextInput
                        value={duration}
                        onChangeText={(t) => setDuration(t.replace(/\D/g, ""))}
                        placeholder="e.g., 12"
                        placeholderTextColor="#6B7690"
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <Text style={[styles.label, { marginTop: 12 }]}>date</Text>
                    <TextInput
                        value={dateText}
                        onChangeText={setDateText}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#6B7690"
                        style={styles.input}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>SUMMARY</Text>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                        <MiniStat label="Duration" value={`${durationNum || 0} mins`} />
                        <MiniStat label="Calories" value={`${caloriesBurned} kcal`} />
                    </View>

                    {selectedWorkout && (
                        <Text style={{ color: MUTED, marginTop: 10, fontSize: 12 }}>
                            Based on {selectedWorkout.kcal_estimate ?? 0} kcal / {selectedWorkout.duration_mins ?? 0} mins from the
                            workout library.
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.primaryBtn, { marginTop: 12, opacity: saving ? 0.7 : 1 }]}
                    onPress={saveWorkout}
                    disabled={saving}
                >
                    <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Workout"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.miniStat}>
            <Text style={{ color: MUTED, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: "white", fontWeight: "900", marginTop: 4 }}>{value}</Text>
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
    headerTitle: { color: "white", fontWeight: "900" as const, fontSize: 16 },
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
    card: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
        marginTop: 20,
    },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    label: {
        color: "#6B7690",
        fontWeight: "800" as const,
        textTransform: "lowercase" as const,
        marginTop: 10,
        marginBottom: 8,
    },
    input: {
        height: 54,
        borderRadius: 14,
        paddingHorizontal: 14,
        color: "white",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: ACCENT,
    },
    readonlyBox: {
        minHeight: 54,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 16,
        borderWidth: 1.5,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    workoutRow: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: 12,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
    },
    workoutTitle: {
        color: "white",
        fontWeight: "900" as const,
        fontSize: 14,
    },
    workoutMeta: {
        color: MUTED,
        fontSize: 12,
        marginTop: 4,
    },
    miniStat: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: 12,
    },
    primaryBtn: {
        height: 56,
        borderRadius: 999,
        backgroundColor: ACCENT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    primaryText: { color: "white", fontWeight: "900" as const, fontSize: 16 },
};