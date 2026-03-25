import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

type Status = "pending" | "approved" | "declined" | "ended";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerRequests() {
    const [active, setActive] = useState<Status | "all">("all");
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser();

            if (userErr) throw userErr;
            if (!user) {
                setRequests([]);
                return;
            }

            const { data: rows, error } = await supabase
                .from("user_trainers")
                .select("id, trainer_id, package_id, status, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const trainerIds = [...new Set((rows || []).map((x) => x.trainer_id))];
            const packageIds = [...new Set((rows || []).map((x) => x.package_id).filter(Boolean))];

            const { data: trainers } = trainerIds.length
                ? await supabase.from("profiles").select("id, first_name").in("id", trainerIds)
                : { data: [] as any[] };

            const { data: trainerProfiles } = trainerIds.length
                ? await supabase.from("trainer_profiles").select("trainer_id, specialty").in("trainer_id", trainerIds)
                : { data: [] as any[] };

            const { data: packages } = packageIds.length
                ? await supabase.from("trainer_packages").select("id, title, price").in("id", packageIds)
                : { data: [] as any[] };

            const trainerMap = new Map((trainers || []).map((x) => [x.id, x.first_name]));
            const specialtyMap = new Map((trainerProfiles || []).map((x) => [x.trainer_id, x.specialty]));
            const packageMap = new Map((packages || []).map((x) => [x.id, x]));

            const mapped = (rows || []).map((r) => {
                const pkg = packageMap.get(r.package_id);
                return {
                    id: r.id,
                    trainerId: r.trainer_id,
                    trainerName: trainerMap.get(r.trainer_id) || "Trainer",
                    specialty: specialtyMap.get(r.trainer_id) || "Fitness Coaching",
                    plan: pkg?.title || "Plan",
                    pricePerMonth: Number(pkg?.price || 0),
                    status: r.status,
                    createdAt: new Date(r.created_at).toLocaleDateString(),
                    note:
                        r.status === "pending"
                            ? "Waiting for trainer confirmation."
                            : r.status === "approved"
                                ? "Approved."
                                : r.status === "declined"
                                    ? "Request declined."
                                    : "Relationship ended.",
                };
            });

            setRequests(mapped);
        } catch (e) {
            console.log("loadRequests error", e);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [loadRequests])
    );

    const filtered = useMemo(() => {
        if (active === "all") return requests;
        return requests.filter((r) => r.status === active);
    }, [active, requests]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={ACCENT} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Requests</Text>

                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.push("/userTabs/trainer/browse")}>
                        <Ionicons name="add" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
                    <View style={{ flexDirection: "row", gap: 10, paddingRight: 6 }}>
                        <Chip text="All" active={active === "all"} onPress={() => setActive("all")} />
                        <Chip text="Pending" active={active === "pending"} onPress={() => setActive("pending")} />
                        <Chip text="Approved" active={active === "approved"} onPress={() => setActive("approved")} />
                        <Chip text="Declined" active={active === "declined"} onPress={() => setActive("declined")} />
                    </View>
                </ScrollView>

                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>SUMMARY</Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                        <MiniStat icon="time-outline" label="Pending" value={`${requests.filter((r) => r.status === "pending").length}`} />
                        <MiniStat icon="checkmark-circle-outline" label="Approved" value={`${requests.filter((r) => r.status === "approved").length}`} />
                        <MiniStat icon="close-circle-outline" label="Declined" value={`${requests.filter((r) => r.status === "declined").length}`} />
                        <MiniStat icon="list-outline" label="Total" value={`${requests.length}`} />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Your requests</Text>

                {filtered.length === 0 ? (
                    <View style={[styles.card, { alignItems: "center", paddingVertical: 20 }]}>
                        <Text style={{ color: MUTED, fontWeight: "800" }}>No requests found.</Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {filtered.map((r) => (
                            <View key={r.id} style={styles.requestCard}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>{r.trainerName}</Text>
                                        <Text style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>
                                            {r.specialty} • {r.plan} • ${r.pricePerMonth}/mo
                                        </Text>
                                    </View>

                                    <StatusPill status={r.status} />
                                </View>

                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Ionicons name="calendar-outline" size={14} color={MUTED} />
                                        <Text style={{ color: MUTED, fontSize: 12 }}>{r.createdAt}</Text>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        style={styles.smallBtn}
                                        onPress={() => router.push(`/userTabs/trainer/${r.trainerId}`)}
                                    >
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>
                                            {r.status === "approved" ? "View" : "Profile"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {!!r.note && (
                                    <Text style={{ color: "#AEB8CA", marginTop: 10, fontSize: 12, lineHeight: 16 }}>{r.note}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function Chip({ text, active, onPress }: { text: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={{
                height: 36,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? "rgba(255,77,45,0.35)" : BORDER,
                backgroundColor: active ? "rgba(255,77,45,0.12)" : CARD2,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Text style={{ color: active ? "#FFD3CA" : MUTED, fontWeight: "900", fontSize: 12 }}>{text}</Text>
        </TouchableOpacity>
    );
}

function StatusPill({ status }: { status: Status }) {
    const cfg =
        status === "pending"
            ? { bg: "rgba(255,209,102,0.14)", bd: "rgba(255,209,102,0.35)", tx: "#FFE8B5", icon: "time-outline" }
            : status === "approved"
                ? { bg: "rgba(34,197,94,0.14)", bd: "rgba(34,197,94,0.35)", tx: "#CFFFE0", icon: "checkmark-circle-outline" }
                : { bg: "rgba(239,68,68,0.14)", bd: "rgba(239,68,68,0.35)", tx: "#FFD0D0", icon: "close-circle-outline" };

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                height: 30,
                borderRadius: 999,
                backgroundColor: cfg.bg,
                borderWidth: 1,
                borderColor: cfg.bd,
            }}
        >
            <Ionicons name={cfg.icon as any} size={14} color={cfg.tx} />
            <Text style={{ color: cfg.tx, fontWeight: "900", fontSize: 12, textTransform: "capitalize" }}>{status}</Text>
        </View>
    );
}

function MiniStat({ icon, label, value }: any) {
    return (
        <View style={styles.miniStat}>
            <Ionicons name={icon} size={16} color={ACCENT} />
            <View style={{ marginLeft: 8 }}>
                <Text style={{ color: MUTED, fontSize: 12 }}>{label}</Text>
                <Text style={{ color: "white", fontWeight: "900", marginTop: 2 }}>{value}</Text>
            </View>
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
    sectionTitle: {
        fontSize: 18,
        color: ACCENT,
        fontWeight: "900" as const,
        marginTop: 14,
        marginBottom: 8,
    },
    card: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    miniStat: {
        width: "48%" as const,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: 12,
        flexDirection: "row" as const,
        alignItems: "center" as const,
    },
    requestCard: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    smallBtn: {
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
};