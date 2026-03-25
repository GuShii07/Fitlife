import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

const ORANGE = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type ClientRow = {
  id: string;
  name: string;
  status: string;
  last: string;
  goal: string;
};

export default function Clients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const loadClients = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: relations } = await supabase
        .from("user_trainers")
        .select("id, user_id, status, created_at")
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false });

      const rows = relations || [];
      setPendingCount(rows.filter((x) => x.status === "pending").length);

      const approved = rows.filter((x) => x.status === "approved");
      if (approved.length === 0) {
        setClients([]);
        return;
      }

      const userIds = approved.map((x) => x.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name")
        .in("id", userIds);

      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("user_id, created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      const profileMap = new Map((profiles || []).map((p) => [p.id, p.first_name]));
      const latestWorkoutMap = new Map<string, string>();

      for (const w of workouts || []) {
        if (!latestWorkoutMap.has(w.user_id)) {
          latestWorkoutMap.set(w.user_id, w.created_at);
        }
      }

      const mapped: ClientRow[] = approved.map((r) => {
        const lastWorkout = latestWorkoutMap.get(r.user_id);
        return {
          id: r.user_id,
          name: profileMap.get(r.user_id) || "Client",
          status: "Active",
          last: lastWorkout ? formatRelative(lastWorkout) : "No workouts yet",
          goal: "Fitness goal",
        };
      });

      setClients(mapped);
    } catch (e) {
      console.log("Clients load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadClients();
    }, [loadClients])
  );

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
        <Text style={styles.title}>Clients</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CLIENT LIST</Text>

          {clients.length === 0 ? (
            <Text style={{ color: MUTED, marginTop: 12 }}>No approved clients yet.</Text>
          ) : (
            clients.map((c) => (
              <TouchableOpacity key={c.id} activeOpacity={0.9} style={styles.row}>
                <View style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "900" }}>{c.name}</Text>
                  <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                    {c.goal} • Last active: {c.last}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={{ color: "#7FF2C6", fontWeight: "900", fontSize: 12 }}>
                    {c.status}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity activeOpacity={0.9} style={[styles.cta, { marginTop: 12 }]}>
          <Ionicons name="person-add-outline" size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "900" }}>
            Review Requests ({pendingCount})
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function formatRelative(dateString: string) {
  const date = new Date(dateString).getTime();
  const now = Date.now();
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday";
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

const styles = {
  title: { color: "white", fontSize: 28, fontWeight: "900" as const, marginTop: 40, marginBottom: 14 },
  card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
  row: {
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
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: "#E6E6E6" },
  badge: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 6,
    backgroundColor: "rgba(0,200,120,0.12)",
    borderColor: "rgba(0,200,120,0.25)",
  },
  cta: {
    height: 56,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 10,
  },
};