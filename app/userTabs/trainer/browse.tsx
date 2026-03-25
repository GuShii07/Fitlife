import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

type Trainer = {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    reviews: number;
    pricePerMonth: number;
    location: string;
    online: boolean;
    verified: boolean;
    bio: string;
    profileImageUrl: string | null;
};

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerBrowse() {
    const [query, setQuery] = useState("");
    const [activeChip, setActiveChip] = useState("All");
    const [loading, setLoading] = useState(true);
    const [trainers, setTrainers] = useState<Trainer[]>([]);

    const loadTrainers = useCallback(async () => {
        try {
            setLoading(true);

            const { data: approvedProfiles, error } = await supabase
                .from("profiles")
                .select("id, first_name, role, trainer_approved")
                .eq("role", "TRAINER")
                .eq("trainer_approved", true);

            if (error) throw error;

            const trainerIds = (approvedProfiles || []).map((x) => x.id);

            if (trainerIds.length === 0) {
                setTrainers([]);
                return;
            }

            const { data: trainerProfiles, error: tpError } = await supabase
                .from("trainer_profiles")
                .select("*")
                .in("trainer_id", trainerIds)
                .eq("is_available", true);

            if (tpError) throw tpError;

            const mapped: Trainer[] = (trainerProfiles || []).map((tp: any) => {
                const base = (approvedProfiles || []).find((p) => p.id === tp.trainer_id);

                return {
                    id: tp.trainer_id,
                    name: base?.first_name || "Trainer",
                    specialty: tp.specialty || "Fitness Coaching",
                    rating: Number(tp.rating || 0),
                    reviews: Number(tp.total_reviews || 0),
                    pricePerMonth: Number(tp.monthly_rate || 0),
                    location: tp.location || "Online",
                    online: !!tp.is_online,
                    verified: !!tp.is_verified,
                    bio: tp.bio || "No bio added yet.",
                    profileImageUrl: tp.profile_image_url || null,
                };
            });

            setTrainers(mapped);
        } catch (e) {
            console.log("loadTrainers error", e);
            setTrainers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTrainers();
        }, [loadTrainers])
    );

    const chips = useMemo(() => {
        const specialties = Array.from(new Set(trainers.map((t) => t.specialty).filter(Boolean)));
        return ["All", ...specialties];
    }, [trainers]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return trainers.filter((t) => {
            const chipOk = activeChip === "All" ? true : t.specialty === activeChip;
            const textOk =
                !q ||
                t.name.toLowerCase().includes(q) ||
                t.specialty.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q);
            return chipOk && textOk;
        });
    }, [trainers, query, activeChip]);

    const featured = filtered[0];

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={ACCENT} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.hello}>Trainers</Text>
                        <Text style={styles.welcome}>Find a coach, get verified guidance.</Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn}>
                        <Ionicons name="notifications-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color={MUTED} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search trainer, specialty, location…"
                        placeholderTextColor="#6B7690"
                        style={styles.searchInput}
                    />
                    {!!query && (
                        <TouchableOpacity activeOpacity={0.85} onPress={() => setQuery("")}>
                            <Ionicons name="close-circle" size={18} color={MUTED} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: "row", gap: 10, paddingRight: 6 }}>
                        {chips.map((c) => {
                            const active = c === activeChip;
                            return (
                                <TouchableOpacity
                                    key={c}
                                    activeOpacity={0.9}
                                    onPress={() => setActiveChip(c)}
                                    style={[
                                        styles.chip,
                                        {
                                            borderColor: active ? "rgba(255,77,45,0.35)" : BORDER,
                                            backgroundColor: active ? "rgba(255,77,45,0.12)" : CARD2,
                                        },
                                    ]}
                                >
                                    <Text style={{ color: active ? "#FFD3CA" : MUTED, fontWeight: "900", fontSize: 12 }}>{c}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {featured ? (
                    <View style={[styles.card, { marginTop: 14 }]}>
                        <Text style={styles.cardTitle}>FEATURED</Text>

                        <View style={{ flexDirection: "row", gap: 12, marginTop: 12, alignItems: "center" }}>
                            <View style={styles.avatarBig}>
                                {featured.profileImageUrl ? (
                                    <Image source={{ uri: featured.profileImageUrl }} style={{ width: "100%", height: "100%" }} />
                                ) : (
                                    <View style={{ width: "100%", height: "100%", backgroundColor: "#E6E6E6" }} />
                                )}
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>{featured.name}</Text>
                                <Text style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>
                                    {featured.specialty} • {featured.location} • {featured.online ? "Online" : "In-person"}
                                </Text>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
                                    <Stars rating={featured.rating} />
                                    <Text style={{ color: MUTED, fontSize: 12 }}>
                                        {featured.rating.toFixed(1)} ({featured.reviews})
                                    </Text>
                                </View>

                                <Text style={{ color: "#AEB8CA", marginTop: 8, fontSize: 12, lineHeight: 16 }}>{featured.bio}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={[styles.btnOutline, { flex: 1 }]}
                                onPress={() => router.push(`/userTabs/trainer/${featured.id}`)}
                            >
                                <Text style={{ color: "white", fontWeight: "900" }}>View profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={[styles.btnSolid, { flex: 1 }]}
                                onPress={() => router.push({ pathname: "/userTabs/trainer/hire", params: { id: featured.id } })}
                            >
                                <Text style={{ color: "white", fontWeight: "900" }}>Hire • ${featured.pricePerMonth}/mo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.card, { marginTop: 14, alignItems: "center", paddingVertical: 20 }]}>
                        <Text style={{ color: MUTED, fontWeight: "800" }}>No trainers found.</Text>
                    </View>
                )}

                <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionTitle}>Available Trainers</Text>

                    <View style={{ gap: 12 }}>
                        {filtered.map((t) => (
                            <View key={t.id} style={styles.listCard}>
                                <View style={{ flexDirection: "row", gap: 12 }}>
                                    <View style={styles.avatarSm}>
                                        {t.profileImageUrl ? (
                                            <Image source={{ uri: t.profileImageUrl }} style={{ width: "100%", height: "100%" }} />
                                        ) : (
                                            <View style={{ width: "100%", height: "100%", backgroundColor: "#E6E6E6" }} />
                                        )}
                                        {t.online && <View style={styles.onlineDot} />}
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>{t.name}</Text>
                                        <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                                            {t.specialty} • {t.location} • {t.online ? "Online" : "In-person"}
                                        </Text>

                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                                            <Stars rating={t.rating} />
                                            <Text style={{ color: MUTED, fontSize: 12 }}>
                                                {t.rating.toFixed(1)} ({t.reviews})
                                            </Text>
                                            <Text style={{ color: "#AEB8CA", fontSize: 12, marginLeft: "auto" }}>${t.pricePerMonth}/mo</Text>
                                        </View>

                                        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                style={[styles.btnOutline, { flex: 1, height: 42 }]}
                                                onPress={() => router.push(`/userTabs/trainer/${t.id}`)}
                                            >
                                                <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Profile</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                style={[styles.btnSolid, { flex: 1, height: 42 }]}
                                                onPress={() => router.push({ pathname: "/userTabs/trainer/hire", params: { id: t.id } })}
                                            >
                                                <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Hire</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function Stars({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => {
                const idx = i + 1;
                const name = idx <= full ? "star" : idx === full + 1 && half ? "star-half" : "star-outline";
                return <Ionicons key={i} name={name as any} size={14} color="#FFD166" />;
            })}
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
        gap: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
    },
    hello: { color: ACCENT, fontWeight: "900" as const, fontSize: 18 },
    welcome: { color: MUTED, marginTop: 2, fontSize: 12 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
    },
    searchBox: {
        marginTop: 14,
        height: 52,
        borderRadius: 16,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 12,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: "white",
        fontWeight: "700" as const,
    },
    chip: {
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    sectionTitle: {
        color: ACCENT,
        fontWeight: "900" as const,
        marginTop: 6,
        marginBottom: 8,
    },
    card: {
        padding: 14,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
    },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    avatarBig: {
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
    listCard: {
        padding: 12,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
    },
    avatarSm: {
        width: 64,
        height: 64,
        borderRadius: 18,
        overflow: "hidden" as const,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "#E6E6E6",
    },
    onlineDot: {
        position: "absolute" as const,
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: "#22C55E",
        borderWidth: 2,
        borderColor: CARD,
        right: 6,
        bottom: 6,
    },
};