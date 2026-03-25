import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function HireTrainer() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const trainerId = String(id || "");

    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [active, setActive] = useState<string>("");

    const loadPlans = useCallback(async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("trainer_packages")
                .select("*")
                .eq("trainer_id", trainerId)
                .eq("is_active", true)
                .order("price", { ascending: true });

            if (error) throw error;

            const rows = data || [];
            setPlans(rows);
            if (rows.length > 0) setActive(rows[0].id);
        } catch (e) {
            console.log("loadPlans error", e);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [trainerId]);

    useFocusEffect(
        useCallback(() => {
            loadPlans();
        }, [loadPlans])
    );

    const submit = async () => {
        try {
            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser();

            if (userErr) throw userErr;
            if (!user) throw new Error("User not logged in");
            if (!active) throw new Error("Please select a plan");

            const { data: existing } = await supabase
                .from("user_trainers")
                .select("id, status")
                .eq("user_id", user.id)
                .eq("trainer_id", trainerId)
                .in("status", ["pending", "approved"])
                .maybeSingle();

            if (existing) {
                Alert.alert("Already requested", `You already have a ${existing.status} request with this trainer.`);
                return;
            }

            const { error } = await supabase.from("user_trainers").insert({
                user_id: user.id,
                trainer_id: trainerId,
                package_id: active,
                status: "pending",
            });

            if (error) throw error;

            Alert.alert("Request sent", "Your trainer request has been submitted.", [
                { text: "OK", onPress: () => router.replace("/userTabs/trainer/requests") },
            ]);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Could not send request");
        }
    };

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
                <View style={{ marginTop: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={{ color: "white", fontWeight: "900" }}>Hire Trainer</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={[styles.card, { marginTop: 14 }]}>
                    <Text style={styles.cardTitle}>SELECT PLAN</Text>

                    {plans.length === 0 ? (
                        <Text style={{ color: MUTED, marginTop: 10 }}>No plans available yet.</Text>
                    ) : (
                        plans.map((p) => {
                            const isActive = p.id === active;
                            return (
                                <TouchableOpacity
                                    key={p.id}
                                    activeOpacity={0.9}
                                    onPress={() => setActive(p.id)}
                                    style={{
                                        marginTop: 10,
                                        padding: 12,
                                        borderRadius: 16,
                                        backgroundColor: isActive ? "rgba(255,77,45,0.12)" : CARD2,
                                        borderWidth: 1,
                                        borderColor: isActive ? "rgba(255,77,45,0.35)" : BORDER,
                                    }}
                                >
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <Text style={{ color: "white", fontWeight: "900" }}>{p.title}</Text>
                                        <Text style={{ color: "white", fontWeight: "900" }}>${p.price}/mo</Text>
                                    </View>
                                    <Text style={{ color: MUTED, marginTop: 6 }}>{p.description || "No description added"}</Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <TouchableOpacity activeOpacity={0.9} style={styles.btnSolid} onPress={submit}>
                    <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Send Request</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = {
    card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    iconBtn: { width: 44, height: 44, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER },
    btnSolid: { marginTop: 14, height: 56, borderRadius: 999, backgroundColor: ACCENT, alignItems: "center" as const, justifyContent: "center" as const },
};