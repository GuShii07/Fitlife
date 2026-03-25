// app/(tabs)/home.tsx
// FitLife Home (User) — matches your screenshot style + adds useful dashboard items
// If you don't have react-native-svg installed:
//   npx expo install react-native-svg
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function Home() {
  const userName = "Prajwal";
  const dailyCalorieGoal = 1800;

  const caloriesRemaining = 1000;
  const caloriesConsumed = Math.max(0, dailyCalorieGoal - caloriesRemaining);
  const caloriePct = clamp(caloriesConsumed / dailyCalorieGoal, 0, 1);

  const macros = {
    carbs: { value: 70, max: 180 },
    protein: { value: 55, max: 140 },
    fat: { value: 28, max: 70 },
  };

  const trainer = {
    name: "John Williams",
    time: "5:30 AM",
    price: "$ 140.00",
    hasTrainer: true,
  };

  const exercise = {
    pct: 0.2,
    updated: "Last updated 3mins ago",
  };

  // extra useful homepage items
  const extras = useMemo(
    () => [
      { icon: "water-outline", label: "Water", value: "1.2L / 3L" },
      { icon: "walk-outline", label: "Steps", value: "5,430" },
      { icon: "flame-outline", label: "Streak", value: "4 days" },
      { icon: "moon-outline", label: "Sleep", value: "6h 40m" },
    ],
    [],
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
                <MiniStat icon="restaurant-outline" label="Food" value="4" />
                <MiniStat icon="flame-outline" label="Exercise" value="20" />
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
                  : "Hire a trainer to get guidance"}
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
            <Text style={styles.cardTitle}>WEIGHT</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.addBtn}>
              <Ionicons name="add" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "900" }}>Log</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weightPlaceholder}>
            <Text style={{ color: "#9AA6BD", fontWeight: "800" }}>
              Add your weight to see your progress chart
            </Text>
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
                Upper body — 25 mins
              </Text>
              <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 2 }}>
                Starts in 45 mins • Home
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

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Ionicons name={icon as any} size={14} color="#9AA6BD" />
      <Text style={{ color: "#9AA6BD", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>
        {value}
      </Text>
    </View>
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
