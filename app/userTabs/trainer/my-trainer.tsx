import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function MyTrainer() {
    const [loading, setLoading] = useState(true);
    const [coach, setCoach] = useState<any>(null);

    const loadCoach = useCallback(async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser();

            if (userErr) throw userErr;
            if (!user) {
                setCoach(null);
                return;
            }

            const { data: relation, error: relationErr } = await supabase
                .from("user_trainers")
                .select("id, trainer_id, package_id, status, created_at")
                .eq("user_id", user.id)
                .eq("status", "approved")
                .order("created_at", { ascending: false })
                .maybeSingle();

            if (relationErr || !relation) {
                setCoach(null);
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("id, first_name")
                .eq("id", relation.trainer_id)
                .single();

            const { data: tp } = await supabase
                .from("trainer_profiles")
                .select("*")
                .eq("trainer_id", relation.trainer_id)
                .maybeSingle();

            const { data: pkg } = relation.package_id
                ? await supabase
                    .from("trainer_packages")
                    .select("*")
                    .eq("id", relation.package_id)
                    .maybeSingle()
                : { data: null as any };

            setCoach({
                id: relation.trainer_id,
                name: profile?.first_name || "Trainer",
                specialty: tp?.specialty || "Fitness Coaching",
                rating: Number(tp?.rating || 0),
                sessionsThisWeek: pkg?.sessions_per_week || 0,
                plan: {
                    name: pkg?.title || "Active Plan",
                    price: Number(pkg?.price || 0),
                },
                profileImageUrl: tp?.profile_image_url || null,
            });
        } catch (e) {
            console.log("loadCoach error", e);
            setCoach(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCoach();
        }, [loadCoach])
    );

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

                    <Text style={styles.headerTitle}>My Trainer</Text>

                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.push("/userTabs/trainer/browse")}>
                        <Ionicons name="people-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {!coach ? (
                    <View style={[styles.card, { marginTop: 14, alignItems: "center", paddingVertical: 22 }]}>
                        <Ionicons name="person-add-outline" size={28} color={ACCENT} />
                        <Text style={{ color: "white", fontWeight: "900", marginTop: 10 }}>No trainer yet</Text>
                        <Text style={{ color: MUTED, marginTop: 6, textAlign: "center" }}>
                            Browse trainers and send a request to start coaching.
                        </Text>

                        <TouchableOpacity activeOpacity={0.9} style={[styles.btnSolid, { marginTop: 14 }]} onPress={() => router.push("/userTabs/trainer/browse")}>
                            <Text style={{ color: "white", fontWeight: "900" }}>Browse Trainers</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={[styles.card, { marginTop: 14 }]}>
                            <Text style={styles.cardTitle}>ACTIVE COACH</Text>

                            <View style={{ flexDirection: "row", gap: 12, marginTop: 12, alignItems: "center" }}>
                                <View style={styles.avatar}>
                                    {coach.profileImageUrl ? (
                                        <Image source={{ uri: coach.profileImageUrl }} style={{ width: "100%", height: "100%" }} />
                                    ) : (
                                        <View style={{ width: "100%", height: "100%", backgroundColor: "#E6E6E6" }} />
                                    )}
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>{coach.name}</Text>
                                    <Text style={{ color: MUTED, marginTop: 2 }}>{coach.specialty}</Text>

                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                                        <Ionicons name="star" size={14} color="#FFD166" />
                                        <Text style={{ color: MUTED, fontSize: 12 }}>{coach.rating.toFixed(1)} rating</Text>

                                        <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Ionicons name="calendar-outline" size={14} color={MUTED} />
                                            <Text style={{ color: MUTED, fontSize: 12 }}>{coach.sessionsThisWeek} sessions/week</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                                <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1 }]}>
                                    <Text style={{ color: "white", fontWeight: "900" }}>Message</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={[styles.btnSolid, { flex: 1 }]}
                                    onPress={() => router.push(`/userTabs/trainer/${coach.id}`)}
                                >
                                    <Text style={{ color: "white", fontWeight: "900" }}>View Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.card, { marginTop: 12 }]}>
                            <Text style={styles.cardTitle}>YOUR PLAN</Text>

                            <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ color: "white", fontWeight: "900" }}>{coach.plan.name}</Text>
                                    <Text style={{ color: "white", fontWeight: "900" }}>${coach.plan.price}/mo</Text>
                                </View>

                                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                    <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1, height: 42 }]}>
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Manage</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1, height: 42 }]}>
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
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
    },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    avatar: {
        width: 74,
        height: 74,
        borderRadius: 20,
        overflow: "hidden" as const,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "#E6E6E6",
    },
    btnSolid: {
        height: 46,
        borderRadius: 16,
        backgroundColor: ACCENT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    btnOutline: {
        height: 46,
        borderRadius: 16,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
};