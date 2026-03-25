import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type TxRow = {
  id: string;
  title: string;
  amount: number;
  created_at: string;
};

export default function Earnings() {
  const [loading, setLoading] = useState(true);
  const [weekTotal, setWeekTotal] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  const loadEarnings = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const { data: tx } = await supabase
        .from("trainer_transactions")
        .select("id, title, amount, created_at, transaction_type")
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false });

      const allTx = tx || [];
      setTransactions(allTx.slice(0, 10));

      const weekly = allTx
        .filter((x) => new Date(x.created_at) >= weekStart)
        .reduce((sum, x) => sum + Number(x.amount || 0), 0);

      const weeklySessions = allTx.filter(
        (x) =>
          new Date(x.created_at) >= weekStart &&
          x.transaction_type === "session"
      ).length;

      setWeekTotal(weekly);
      setSessionCount(weeklySessions);

      const { count } = await supabase
        .from("user_trainers")
        .select("*", { count: "exact", head: true })
        .eq("trainer_id", user.id)
        .eq("status", "approved");

      setActiveClients(count || 0);
    } catch (e) {
      console.log("Earnings load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadEarnings();
    }, [loadEarnings])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#FF4D2D" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Earnings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>THIS WEEK</Text>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 28, marginTop: 10 }}>
            ${weekTotal.toFixed(2)}
          </Text>
          <Text style={{ color: MUTED, marginTop: 4 }}>
            {sessionCount} sessions • {activeClients} active clients
          </Text>

          <View style={styles.divider} />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Mini icon="wallet-outline" label="Payout" value="Pending" />
            <Mini icon="card-outline" label="Method" value="Bank" />
          </View>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>RECENT TRANSACTIONS</Text>

          {transactions.length === 0 ? (
            <Text style={{ color: MUTED, marginTop: 12 }}>No transactions yet.</Text>
          ) : (
            transactions.map((tx) => (
              <Tx
                key={tx.id}
                title={tx.title}
                value={`+ $${Number(tx.amount).toFixed(2)}`}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Mini({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon as any} size={16} color={MUTED} />
      <Text style={{ color: MUTED, fontSize: 12 }}>{label}:</Text>
      <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>{value}</Text>
    </View>
  );
}

function Tx({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.tx}>
      <Text style={{ color: "white", fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: "#7FF2C6", fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

const styles = {
  title: { color: "white", fontSize: 28, fontWeight: "900" as const, marginTop: 40, marginBottom: 14 },
  card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },
  tx: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD2,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
};