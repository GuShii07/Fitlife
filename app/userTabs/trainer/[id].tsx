import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const trainerId = String(id || "");

    const [loading, setLoading] = useState(true);
    const [trainer, setTrainer] = useState<any>(null);
    const [packages, setPackages] = useState<any[]>([]);

    const loadTrainer = useCallback(async () => {
        try {
            setLoading(true);

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, first_name, role, trainer_approved")
                .eq("id", trainerId)
                .eq("role", "TRAINER")
                .eq("trainer_approved", true)
                .single();

            if (profileError) throw profileError;

            const { data: tp } = await supabase
                .from("trainer_profiles")
                .select("*")
                .eq("trainer_id", trainerId)
                .maybeSingle();

            const { data: packageRows } = await supabase
                .from("trainer_packages")
                .select("*")
                .eq("trainer_id", trainerId)
                .eq("is_active", true)
                .order("price", { ascending: true });

            setTrainer({
                id: profile.id,
                name: profile.first_name || "Trainer",
                specialty: tp?.specialty || "Fitness Coaching",
                price: Number(tp?.monthly_rate || 0),
                rating: Number(tp?.rating || 0),
                reviews: Number(tp?.total_reviews || 0),
                location: tp?.location || "Online",
                online: !!tp?.is_online,
                verified: !!tp?.is_verified,
                bio:
                    tp?.bio ||
                    "Coaching focused on clear structure, weekly progress checks, and sustainable habits.",
                profileImageUrl: tp?.profile_image_url || null,
            });

            setPackages(packageRows || []);
        } catch (e) {
            console.log("loadTrainer error", e);
            setTrainer(null);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    }, [trainerId]);

    useFocusEffect(
        useCallback(() => {
            loadTrainer();
        }, [loadTrainer])
    );

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={ACCENT} />
            </View>
        );
    }

    if (!trainer) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center", padding: 20 }}>
                <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>Trainer not found</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginTop: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={{ color: "white", fontWeight: "900" }}>Trainer Profile</Text>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn}>
                        <Ionicons name="share-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { marginTop: 14 }]}>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                        <View style={styles.avatar}>
                            {trainer.profileImageUrl ? (
                                <Image source={{ uri: trainer.profileImageUrl }} style={{ width: "100%", height: "100%" }} />
                            ) : (
                                <View style={{ width: "100%", height: "100%", backgroundColor: "#E6E6E6" }} />
                            )}
                            {trainer.online && <View style={styles.onlineDot} />}
                        </View>

                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>{trainer.name}</Text>
                                {trainer.verified && (
                                    <View style={styles.verified}>
                                        <Ionicons name="checkmark-circle" size={14} color={ACCENT} />
                                        <Text style={{ color: "#FFD3CA", fontWeight: "900", fontSize: 12 }}>Verified</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                {trainer.specialty} • {trainer.location} • {trainer.online ? "Online" : "In-person"}
                            </Text>

                            <Text style={{ color: MUTED, marginTop: 6 }}>
                                ⭐ {trainer.rating.toFixed(1)} ({trainer.reviews} reviews)
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                        <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1 }]}>
                            <Text style={{ color: "white", fontWeight: "900" }}>Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.btnSolid, { flex: 1 }]}
                            onPress={() => router.push({ pathname: "/userTabs/trainer/hire", params: { id: trainerId } })}
                        >
                            <Text style={{ color: "white", fontWeight: "900" }}>Hire • ${trainer.price}/mo</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>ABOUT</Text>
                    <Text style={{ color: "#C7CFDD", marginTop: 10, lineHeight: 18 }}>{trainer.bio}</Text>
                </View>

                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>PACKAGES</Text>

                    {packages.length === 0 ? (
                        <Text style={{ color: MUTED, marginTop: 10 }}>No packages available yet.</Text>
                    ) : (
                        packages.map((pkg) => (
                            <Package
                                key={pkg.id}
                                name={pkg.title}
                                desc={pkg.description || "No description added"}
                                price={`$${pkg.price}/mo`}
                                featured={pkg.is_featured}
                            />
                        ))
                    )}
                </View>

                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>AVAILABILITY</Text>
                    <Text style={{ color: MUTED, marginTop: 10 }}>
                        {trainer.online ? "Available for online coaching." : "Available for in-person coaching."}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function Package({ name, desc, price, featured }: any) {
    return (
        <View
            style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 16,
                backgroundColor: featured ? "rgba(255,77,45,0.12)" : CARD2,
                borderWidth: 1,
                borderColor: featured ? "rgba(255,77,45,0.35)" : BORDER,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "white", fontWeight: "900" }}>{name}</Text>
                <Text style={{ color: "white", fontWeight: "900" }}>{price}</Text>
            </View>
            <Text style={{ color: MUTED, marginTop: 6 }}>{desc}</Text>
        </View>
    );
}

const styles = {
    card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    iconBtn: { width: 44, height: 44, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER },
    avatar: { width: 84, height: 84, borderRadius: 22, overflow: "hidden" as const, borderWidth: 1, borderColor: BORDER },
    onlineDot: { position: "absolute" as const, width: 12, height: 12, borderRadius: 999, backgroundColor: "#22C55E", borderWidth: 2, borderColor: CARD, right: 8, bottom: 8 },
    verified: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 999, backgroundColor: "rgba(255,77,45,0.12)", borderWidth: 1, borderColor: "rgba(255,77,45,0.25)" },
    btnSolid: { height: 46, borderRadius: 16, backgroundColor: ACCENT, alignItems: "center" as const, justifyContent: "center" as const },
    btnOutline: { height: 46, borderRadius: 16, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, alignItems: "center" as const, justifyContent: "center" as const },
};