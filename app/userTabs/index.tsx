// app/(tabs)/home.tsx
// FitLife Home (User) — matches your screenshot style + adds useful dashboard items
// If you don't have react-native-svg installed:
//   npx expo install react-native-svg
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { supabase } from "../../lib/supabase";

const EXERCISE_DAILY_GOAL_KCAL = 300;

type DietLogRow = {
  calories: number | null;
  carbs: number | null;
  protein: number | null;
  fat: number | null;
  created_at?: string;
};

type WorkoutLogRow = {
  id: string;
  title: string;
  calories_burned: number | null;
  total_duration_mins: number | null;
  created_at?: string;
};

type TrainerRelation = {
  trainer_id: string;
  package_id: string | null;
  status: "approved" | "pending" | "declined" | "ended";
  created_at: string;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2000);

  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [foodCount, setFoodCount] = useState(0);

  const [macros, setMacros] = useState({
    carbs: { value: 0, max: 180 },
    protein: { value: 0, max: 140 },
    fat: { value: 0, max: 70 },
  });

  const [exercise, setExercise] = useState({
    pct: 0,
    updated: "No workouts logged yet",
  });

  const [latestWorkout, setLatestWorkout] = useState<WorkoutLogRow | null>(null);

  const [trainer, setTrainer] = useState({
    name: "",
    time: "",
    price: "",
    hasTrainer: false,
  });

  const [trainerSummary, setTrainerSummary] = useState({
    active: 0,
    pending: 0,
  });

  const caloriesRemaining = Math.max(0, dailyCalorieGoal - caloriesConsumed);
  const caloriePct = clamp(caloriesConsumed / dailyCalorieGoal, 0, 1);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) {
        setUserName("User");
        setCaloriesConsumed(0);
        setFoodCount(0);
        setLatestWorkout(null);
        setTrainer({ name: "", time: "", price: "", hasTrainer: false });
        setTrainerSummary({ active: 0, pending: 0 });
        return;
      }

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const startIso = startOfDay.toISOString();
      const endIso = endOfDay.toISOString();

      const [profileRes, dietRes, workoutRes, trainerRes] = await Promise.all([
        supabase.from("profiles").select("first_name, calorie_goal").eq("id", user.id).maybeSingle(),
        supabase
          .from("diet_logs")
          .select("calories, carbs, protein, fat, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startIso)
          .lt("created_at", endIso),
        supabase
          .from("workout_logs")
          .select("id, title, calories_burned, total_duration_mins, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_trainers")
          .select("trainer_id, package_id, status, created_at")
          .eq("user_id", user.id)
          .in("status", ["approved", "pending"])
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (dietRes.error) throw dietRes.error;
      if (workoutRes.error) throw workoutRes.error;
      if (trainerRes.error) throw trainerRes.error;

      const profile = profileRes.data;
      setUserName(profile?.first_name?.trim() || "User");

      const goal = Number(profile?.calorie_goal || 2000);
      setDailyCalorieGoal(goal);

      const dietLogs = (dietRes.data || []) as DietLogRow[];
      const consumed = dietLogs.reduce((sum, row) => sum + Number(row.calories || 0), 0);
      const carbs = dietLogs.reduce((sum, row) => sum + Number(row.carbs || 0), 0);
      const protein = dietLogs.reduce((sum, row) => sum + Number(row.protein || 0), 0);
      const fat = dietLogs.reduce((sum, row) => sum + Number(row.fat || 0), 0);

      setCaloriesConsumed(Math.round(consumed));
      setFoodCount(dietLogs.length);
      setMacros({
        carbs: { value: Math.round(carbs), max: 180 },
        protein: { value: Math.round(protein), max: 140 },
        fat: { value: Math.round(fat), max: 70 },
      });

      const workouts = (workoutRes.data || []) as WorkoutLogRow[];
      const todaysWorkouts = workouts.filter((w) => {
        if (!w.created_at) return false;
        return w.created_at >= startIso && w.created_at < endIso;
      });
      const totalExerciseCalories = todaysWorkouts.reduce(
        (sum, row) => sum + Number(row.calories_burned || 0),
        0,
      );

      const newestWorkout = workouts[0] || null;
      setLatestWorkout(newestWorkout);
      setExercise({
        pct: clamp(totalExerciseCalories / EXERCISE_DAILY_GOAL_KCAL, 0, 1),
        updated: newestWorkout?.created_at
          ? `Last updated ${formatRelativeTime(newestWorkout.created_at)}`
          : "No workouts logged yet",
      });

      const trainerRows = (trainerRes.data || []) as TrainerRelation[];
      const approvedRows = trainerRows.filter((row) => row.status === "approved");
      const pendingRows = trainerRows.filter((row) => row.status === "pending");

      setTrainerSummary({ active: approvedRows.length, pending: pendingRows.length });

      const latestApproved = approvedRows[0];
      if (!latestApproved) {
        setTrainer({
          name: "",
          time: pendingRows.length > 0 ? "Request pending" : "No active trainer",
          price: "",
          hasTrainer: false,
        });
      } else {
        const [trainerProfileRes, packageRes] = await Promise.all([
          supabase.from("profiles").select("first_name").eq("id", latestApproved.trainer_id).maybeSingle(),
          latestApproved.package_id
            ? supabase
                .from("trainer_packages")
                .select("price")
                .eq("id", latestApproved.package_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (trainerProfileRes.error) throw trainerProfileRes.error;
        if (packageRes.error) throw packageRes.error;

        const trainerName = trainerProfileRes.data?.first_name?.trim() || "Your Trainer";
        const packagePrice = Number(packageRes.data?.price || 0);

        setTrainer({
          name: trainerName,
          time: `Since ${formatShortDate(latestApproved.created_at)}`,
          price: packagePrice > 0 ? `${formatCurrency(packagePrice)}/mo` : "Active plan",
          hasTrainer: true,
        });
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  // extra useful homepage items
  const extras = useMemo(
    () => [
      { icon: "restaurant-outline", label: "Foods Logged", value: `${foodCount}` },
      { icon: "barbell-outline", label: "Workout Goal", value: `${Math.round(exercise.pct * 100)}%` },
      { icon: "person-outline", label: "Active Trainer", value: `${trainerSummary.active}` },
      { icon: "time-outline", label: "Pending Requests", value: `${trainerSummary.pending}` },
    ],
    [exercise.pct, foodCount, trainerSummary.active, trainerSummary.pending],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hello, {userName}</Text>
            <Text style={styles.welcome}>Welcome to FitLife</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.avatar}
            onPress={() => router.push("/settings")}
          >
            {/* Replace with Image later */}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        {loading && (
          <View style={[styles.card, { marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 }]}> 
            <ActivityIndicator color="#FF4D2D" />
            <Text style={{ color: "#9AA6BD", fontWeight: "700" }}>Refreshing your dashboard...</Text>
          </View>
        )}

        {/* Calories card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CALORIES</Text>

          <View style={{ flexDirection: "row", marginTop: 12, gap: 14 }}>
            {/* Ring */}
            <View
              style={{
                width: 120,
                height: 120,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ProgressRing size={116} stroke={10} progress={caloriePct} />
              <View style={{ position: "absolute", alignItems: "center" }}>
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 18 }}
                >
                  {caloriesRemaining}cal
                </Text>
                <Text style={{ color: "#9AA6BD", fontSize: 12 }}>
                  Remaining
                </Text>
              </View>
            </View>

            {/* Macros */}
            <View style={{ flex: 1, gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
              </View>

              <MacroRow
                label="Carbs"
                value={macros.carbs.value}
                max={macros.carbs.max}
              />
              <MacroRow
                label="Protein"
                value={macros.protein.value}
                max={macros.protein.max}
              />
              <MacroRow
                label="Fat"
                value={macros.fat.value}
                max={macros.fat.max}
              />
            </View>
          </View>

          {/* Quick actions (useful on homepage) */}
          {/* <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <ActionPill icon="add-circle-outline" text="Log meal" />
            <ActionPill icon="barbell-outline" text="Start workout" />
            <ActionPill icon="scan-outline" text="Scan food" />
          </View> */}
        </View>

        {/* 2-up cards (Trainer + Exercise) */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          {/* Trainer */}
          <View style={[styles.card, { flex: 1 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.cardTitle}>TRAINER</Text>
              <TouchableOpacity activeOpacity={0.9} style={styles.chatIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color="#FF4D2D"
                />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginTop: 12 }}>
              <View style={styles.trainerAvatar} />
              <Text
                style={{ color: "white", fontWeight: "900", marginTop: 10 }}
              >
                {trainer.hasTrainer ? trainer.name : "No trainer yet"}
              </Text>
              <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 2 }}>
                {trainer.hasTrainer
                  ? "Your coach today"
                  : trainer.time || "Hire a trainer to get guidance"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 14,
              }}
            >
              <MiniInfo icon="time-outline" text={trainer.time} />
              <MiniInfo icon="cash-outline" text={trainer.price} />
            </View>

            {!trainer.hasTrainer && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.smallBtn, { marginTop: 12 }]}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>
                  Find trainers
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Exercise */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>EXERCISE</Text>

            <View style={{ alignItems: "center", marginTop: 12 }}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ProgressRing size={116} stroke={10} progress={exercise.pct} />
                <View style={{ position: "absolute", alignItems: "center" }}>
                  <Ionicons name="walk-outline" size={28} color="white" />
                </View>
              </View>

              <Text
                style={{ color: "white", fontWeight: "900", marginTop: 10 }}
              >
                {Math.round(exercise.pct * 100)}%{" "}
                <Text style={{ color: "#9AA6BD", fontWeight: "700" }}>
                  remaining
                </Text>
              </Text>
              <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 2 }}>
                {exercise.updated}
              </Text>
            </View>
          </View>
        </View>

        {/* Extras row (useful homepage items) */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.cardTitle}>DAILY STATS</Text>
            <TouchableOpacity activeOpacity={0.9}>
              <Text style={{ color: "#9AA6BD", fontWeight: "800" }}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 12,
            }}
          >
            {extras.map((x) => (
              <View key={x.label} style={styles.statTile}>
                <Ionicons name={x.icon as any} size={18} color="#FF4D2D" />
                <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 6 }}>
                  {x.label}
                </Text>
                <Text
                  style={{ color: "white", fontWeight: "900", marginTop: 2 }}
                >
                  {x.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weight card (placeholder like your screenshot, but useful) */}
        <View style={[styles.card, { marginTop: 12 }]}> 
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.cardTitle}>LATEST WORKOUT</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.addBtn}>
              <Ionicons name="add" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "900" }}>New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weightPlaceholder}>
            {!latestWorkout ? (
              <Text style={{ color: "#9AA6BD", fontWeight: "800" }}>
                You have no workouts yet. Log your first workout now.
              </Text>
            ) : (
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>
                  {latestWorkout.title}
                </Text>
                <Text style={{ color: "#9AA6BD", marginTop: 6, fontSize: 12 }}>
                  {latestWorkout.total_duration_mins || 0} mins • {latestWorkout.calories_burned || 0} kcal
                </Text>
                <Text style={{ color: "#9AA6BD", marginTop: 4, fontSize: 12 }}>
                  {latestWorkout.created_at
                    ? `Logged ${formatRelativeTime(latestWorkout.created_at)}`
                    : "Logged recently"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Upcoming (needed on a fitness homepage) */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.cardTitle}>UP NEXT</Text>
            <TouchableOpacity activeOpacity={0.9}>
              <Text style={{ color: "#9AA6BD", fontWeight: "800" }}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nextRow}>
            <View style={styles.nextIcon}>
              <Ionicons name="barbell-outline" size={18} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "900" }}>
                {latestWorkout ? `${latestWorkout.title} — ${latestWorkout.total_duration_mins || 0} mins` : "Log your next workout"}
              </Text>
              <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 2 }}>
                {latestWorkout?.created_at
                  ? `Last activity ${formatRelativeTime(latestWorkout.created_at)}`
                  : "No recent activity"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA6BD" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* -------------------- UI bits -------------------- */

function ProgressRing({
  size,
  stroke,
  progress,
}: {
  size: number;
  stroke: number;
  progress: number; // 0..1
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#2B3446"
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#FF4D2D"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

function MacroRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = clamp(value / max, 0, 1);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: "#9AA6BD", fontSize: 12 }}>{label}</Text>
        <Text style={{ color: "#9AA6BD", fontSize: 12 }}>
          {value}/{max}g
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

function MiniInfo({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Ionicons name={icon as any} size={14} color="#9AA6BD" />
      <Text style={{ color: "#9AA6BD", fontWeight: "500", fontSize: 12 }}>
        {text}
      </Text>
    </View>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatRelativeTime(dateValue: string) {
  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "recently";

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / dayMs));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatShortDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* -------------------- Styles -------------------- */

const styles = {
  headerCard: {
    marginTop: 40,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#111A2C",
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  hello: { color: "#FF4D2D", fontWeight: "900" as const, fontSize: 18 },
  welcome: { color: "#9AA6BD", marginTop: 2, fontSize: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#E6E6E6",
  },

  sectionTitle: {
    fontSize: 18,
    color: "#FF4D2D",
    fontWeight: "900" as const,
    marginTop: 14,
    marginBottom: 8,
  },

  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#111A2C",
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  cardTitle: {
    color: "#AEB8CA",
    fontWeight: "900" as const,
    fontSize: 12,
    letterSpacing: 0.6,
  },

  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#2B3446",
    overflow: "hidden" as const,
  },
  barFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FF4D2D",
  },

  trainerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: "#E6E6E6",
  },

  chatIcon: {
    width: 44,
    height: 30,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.25)",
  },

  smallBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#0F1627",
    borderWidth: 1,
    borderColor: "#1F2A44",
  },

  statTile: {
    width: "48%" as const,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#0F1627",
    borderWidth: 1,
    borderColor: "#1F2A44",
  },

  addBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.25)",
  },

  weightPlaceholder: {
    marginTop: 12,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    backgroundColor: "#0F1627",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 14,
  },

  nextRow: {
    marginTop: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#0F1627",
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  nextIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.25)",
  },

};
