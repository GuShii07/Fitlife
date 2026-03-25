import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

const ORANGE = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerDashboard() {
  const [loading, setLoading] = useState(true);
  const [trainerName, setTrainerName] = useState("Trainer");
  const [sessions, setSessions] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [inactiveClients, setInactiveClients] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [activeClients, setActiveClients] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (profile?.first_name) setTrainerName(profile.first_name);

      const { count: approvedCount } = await supabase
        .from("user_trainers")
        .select("*", { count: "exact", head: true })
        .eq("trainer_id", user.id)
        .eq("status", "approved");

      setActiveClients(approvedCount || 0);

      const { count: pendingCount } = await supabase
        .from("user_trainers")
        .select("*", { count: "exact", head: true })
        .eq("trainer_id", user.id)
        .eq("status", "pending");

      setPendingRequests(pendingCount || 0);

      const today = new Date().toISOString().slice(0, 10);

      const { count: todaySessions } = await supabase
        .from("trainer_transactions")
        .select("*", { count: "exact", head: true })
        .eq("trainer_id", user.id)
        .eq("transaction_type", "session")
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lte("created_at", `${today}T23:59:59.999Z`);

      setSessions(todaySessions || 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const { data: weeklyTx } = await supabase
        .from("trainer_transactions")
        .select("amount")
        .eq("trainer_id", user.id)
        .gte("created_at", weekStart.toISOString());

      const weeklyTotal = (weeklyTx || []).reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      );
      setWeeklyEarnings(weeklyTotal);

      const { data: relations } = await supabase
        .from("user_trainers")
        .select("user_id")
        .eq("trainer_id", user.id)
        .eq("status", "approved");

      const approvedUsers = relations?.map((r) => r.user_id) || [];

      if (approvedUsers.length === 0) {
        setInactiveClients(0);
      } else {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);

        const { data: recentWorkouts } = await supabase
          .from("workout_logs")
          .select("user_id, created_at")
          .in("user_id", approvedUsers)
          .gte("created_at", threeDaysAgo.toISOString());

        const activeUserIds = new Set((recentWorkouts || []).map((x) => x.user_id));
        setInactiveClients(approvedUsers.filter((id) => !activeUserIds.has(id)).length);
      }
    } catch (e) {
      console.log("Trainer dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDashboard();
    }, [loadDashboard])
  );

  const alerts = useMemo(() => {
    const rows = [];
    if (pendingRequests > 0) {
      rows.push({
        icon: "person-add-outline",
        title: "New client requests",
        subtitle: `${pendingRequests} request(s) waiting for review.`,
      });
    }
    if (inactiveClients > 0) {
      rows.push({
        icon: "notifications-outline",
        title: "Client inactivity",
        subtitle: `${inactiveClients} client(s) have not logged recent workouts.`,
      });
    }
    if (rows.length === 0) {
      rows.push({
        icon: "checkmark-circle-outline",
        title: "All clear",
        subtitle: "No urgent alerts right now.",
      });
    }
    return rows;
  }, [pendingRequests, inactiveClients]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Trainer, {trainerName}</Text>
            <Text style={styles.sub}>Manage clients and earnings.</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push("/trainerTabs/settings")} />
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>OVERVIEW</Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <StatTile icon="time-outline" label="Sessions" value={`${sessions}`} />
            <StatTile icon="person-add-outline" label="Requests" value={`${pendingRequests}`} />
            <StatTile icon="alert-circle-outline" label="Inactive" value={`${inactiveClients}`} />
          </View>

          <View style={styles.divider} />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MiniRow icon="people-outline" label="Active clients" value={`${activeClients}`} />
            <MiniRow icon="cash-outline" label="This week" value={`$${weeklyEarnings.toFixed(2)}`} />
          </View>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>ALERTS</Text>
          {alerts.map((a, i) => (
            <AlertRow key={i} icon={a.icon} title={a.title} subtitle={a.subtitle} />
          ))}
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>EARNINGS</Text>
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 22 }}>
              ${weeklyEarnings.toFixed(2)}
            </Text>
            <Text style={{ color: MUTED, marginTop: 4 }}>
              This week • {activeClients} clients active
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.smallBtn, { marginTop: 12 }]}
            onPress={() => router.push("/trainerTabs/earnings")}
          >
            <Text style={{ color: "white", fontWeight: "900" }}>View earnings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon as any} size={18} color={ORANGE} />
      <Text style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>{label}</Text>
      <Text style={{ color: "white", fontWeight: "900", marginTop: 2, fontSize: 18 }}>{value}</Text>
    </View>
  );
}

function MiniRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon as any} size={14} color={MUTED} />
      <Text style={{ color: MUTED, fontSize: 12 }}>{label}:</Text>
      <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>{value}</Text>
    </View>
  );
}

function AlertRow({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.alertRow}>
      <View style={styles.alertIcon}>
        <Ionicons name={icon as any} size={18} color={ORANGE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
      </View>
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
  },
  hello: { color: ORANGE, fontWeight: "900" as const, fontSize: 18 },
  sub: { color: MUTED, marginTop: 2, fontSize: 12 },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: "#E6E6E6" },
  sectionTitle: { fontSize: 18, color: ORANGE, fontWeight: "900" as const, marginTop: 14, marginBottom: 8 },
  card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },
  statTile: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  alertRow: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD2,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
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
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
  },
};