import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type WorkoutLog = {
  id: string;
  title: string;
  workout_date: string;
  total_duration_mins: number;
  total_sets: number;
  calories_burned: number;
};

export default function WorkoutHome() {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workoutsToday, setWorkoutsToday] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    loadTodayLogs();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodayLogs();
    }, [])
  );

  async function loadTodayLogs() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("workout_logs")
        .select("id,title,workout_date,total_duration_mins,total_sets,calories_burned")
        .eq("user_id", user.id)
        .eq("workout_date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWorkoutsToday((data || []) as WorkoutLog[]);
    } catch (e) {
      console.log("loadTodayLogs error", e);
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    return workoutsToday.reduce(
      (acc, w) => {
        acc.calories += Number(w.calories_burned || 0);
        acc.duration += Number(w.total_duration_mins || 0);
        acc.sets += Number(w.total_sets || 0);
        return acc;
      },
      { calories: 0, duration: 0, sets: 0 }
    );
  }, [workoutsToday]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Workout</Text>
            <Text style={styles.welcome}>Log training, watch videos, and compete.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.summaryCard}
          onPress={() => setExpanded(!expanded)}
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totals.calories}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totals.duration}</Text>
                <Text style={styles.statLabel}>Duration (mins)</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totals.sets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
            </View>

            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={22}
              color="#C7CFDD"
              style={{ marginLeft: 10 }}
            />
          </View>

          {expanded && (
            <View style={styles.dropdownContainer}>
              {loading ? (
                <ActivityIndicator color={ACCENT} />
              ) : workoutsToday.length === 0 ? (
                <Text style={{ color: MUTED }}>No workouts logged today.</Text>
              ) : (
                workoutsToday.map((workout) => (
                  <View key={workout.id} style={styles.workoutItem}>
                    <Text style={styles.workoutName}>{workout.title}</Text>

                    <View style={styles.workoutMetaRow}>
                      <Text style={styles.workoutMeta}><Ionicons name="time-outline" size={16} color="#C7CFDD" />  {workout.total_duration_mins} mins</Text>
                      <Text style={styles.workoutMeta}><Ionicons name="barbell-outline" size={16} color="#C7CFDD" />  {workout.total_sets} sets</Text>
                      <Text style={styles.workoutMeta}><Ionicons name="flame-outline" size={16} color="#C7CFDD" />  {workout.calories_burned} kcal</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </TouchableOpacity>

        <ActionCard
          icon="add-circle-outline"
          title="Log Workout"
          subtitle="Record workout duration & calories"
          onPress={() => router.push("/userTabs/workout/log")}
        />

        <ActionCard
          icon="time-outline"
          title="Workout History"
          subtitle="View all logged workouts by date"
          onPress={() => router.push("/userTabs/workout/history")}
        />

        <ActionCard
          icon="barbell-outline"
          title="Browse Workouts"
          subtitle="Explore workouts & watch videos"
          onPress={() => router.push("/userTabs/workout/browse")}
        />

        <ActionCard
          icon="trophy-outline"
          title="Challenges"
          subtitle="Push-up challenge & leaderboard"
          onPress={() => router.push("/userTabs/workout/challenges")}
        />
      </ScrollView>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.bigCard}>
      <View style={styles.bigCardRow}>
        <View style={styles.bigIcon}>
          <Ionicons name={icon} size={22} color={ACCENT} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.bigTitle}>{title}</Text>
          <Text style={styles.bigSub}>{subtitle}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#C7CFDD" />
      </View>
    </TouchableOpacity>
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
  },
  sectionTitle: {
    fontSize: 18,
    color: ACCENT,
    fontWeight: "900" as const,
    marginTop: 14,
    marginBottom: 8,
  },
  summaryCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  statsRow: {
    flexDirection: "row" as const,
    flex: 1,
    justifyContent: "space-between" as const,
  },
  statBox: {
    alignItems: "center" as const,
    flex: 1,
  },
  statValue: {
    color: ACCENT,
    fontWeight: "700" as const,
    fontSize: 40,
  },
  statLabel: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  dropdownContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
  },
  workoutItem: {
    marginBottom: 14,
  },
  workoutName: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: 14,
    marginBottom: 6,
  },
  workoutMetaRow: {
    flexDirection: "row" as const,
    gap: 16,
    flexWrap: "wrap" as const,
  },
  workoutMeta: {
    color: "#C7CFDD",
    fontSize: 12,
  },
  bigCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  bigCardRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  bigIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.25)",
  },
  bigTitle: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 16,
  },
  bigSub: {
    color: "#C7CFDD",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
};