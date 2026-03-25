import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { openStorageFile, TRAINER_UPLOADS_BUCKET } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type Status = "PENDING" | "APPROVED" | "REJECTED";

type TrainerApplication = {
    id: string;
    user_id: string;
    full_name: string;
    gender: string | null;
    age: number | null;
    bio: string | null;
    cert_title: string | null;
    cert_issuer: string | null;
    cert_year: number | null;
    photo_path: string | null;
    certificate_path: string | null;
    status: Status;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
};

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [applications, setApplications] = useState<TrainerApplication[]>([]);
    const [adminId, setAdminId] = useState<string | null>(null);
    const [filter, setFilter] = useState<Status | "ALL">("PENDING");

    useEffect(() => {
        init();
    }, []);

    async function init() {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser();

            if (userErr) throw userErr;

            if (!user) {
                Alert.alert("Not logged in", "Please log in first.");
                router.replace("/auth/Login");
                return;
            }

            setAdminId(user.id);

            const { data: profile, error: profileErr } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profileErr) throw profileErr;

            if (profile?.role !== "ADMIN") {
                Alert.alert("Access denied", "This page is only for admins.");
                router.back();
                return;
            }

            await loadApplications();
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to load admin page.");
        } finally {
            setLoading(false);
        }
    }

    async function loadApplications() {
        const { data, error } = await supabase
            .from("trainer_applications")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        setApplications((data || []) as TrainerApplication[]);
    }

    async function onRefresh() {
        try {
            setRefreshing(true);
            await loadApplications();
        } catch (e: any) {
            Alert.alert("Refresh failed", e?.message || "Please try again.");
        } finally {
            setRefreshing(false);
        }
    }

    async function approveApplication(app: TrainerApplication) {
        if (!adminId) return;

        try {
            setSavingId(app.id);

            const reviewedAt = new Date().toISOString();

            const { error: appErr } = await supabase
                .from("trainer_applications")
                .update({
                    status: "APPROVED",
                    reviewed_by: adminId,
                    reviewed_at: reviewedAt,
                })
                .eq("id", app.id);

            if (appErr) throw appErr;

            const { error: profileErr } = await supabase
                .from("profiles")
                .update({
                    role: "TRAINER",
                    trainer_approved: true,
                    trainer_status: "available",
                })
                .eq("id", app.user_id);

            if (profileErr) throw profileErr;

            // create trainer profile if your table exists
            const { error: trainerProfileErr } = await supabase
                .from("trainer_profiles")
                .upsert(
                    {
                        user_id: app.user_id,
                        full_name: app.full_name,
                        gender: app.gender,
                        age: app.age,
                        bio: app.bio,
                        cert_title: app.cert_title,
                        cert_issuer: app.cert_issuer,
                        cert_year: app.cert_year,
                        photo_path: app.photo_path,
                        certificate_path: app.certificate_path,
                        is_active: true,
                        approved_at: reviewedAt,
                    },
                    { onConflict: "user_id" }
                );
            // if trainer_profiles table is not ready yet, comment this block out temporarily
            if (trainerProfileErr) throw trainerProfileErr;

            await loadApplications();
            Alert.alert("Approved ✅", `${app.full_name} is now an approved trainer.`);
        } catch (e: any) {
            Alert.alert("Approval failed", e?.message || "Please try again.");
        } finally {
            setSavingId(null);
        }
    }

    async function rejectApplication(app: TrainerApplication) {
        if (!adminId) return;

        try {
            setSavingId(app.id);

            const { error: appErr } = await supabase
                .from("trainer_applications")
                .update({
                    status: "REJECTED",
                    reviewed_by: adminId,
                    reviewed_at: new Date().toISOString(),
                })
                .eq("id", app.id);

            if (appErr) throw appErr;

            const { error: profileErr } = await supabase
                .from("profiles")
                .update({
                    trainer_approved: false,
                })
                .eq("id", app.user_id);

            if (profileErr) throw profileErr;

            const { error: trainerProfileErr } = await supabase
                .from("trainer_profiles")
                .update({
                    is_active: false,
                })
                .eq("user_id", app.user_id);

            // if table not created yet, you can remove this block
            if (
                trainerProfileErr &&
                !String(trainerProfileErr.message || "").toLowerCase().includes("does not exist")
            ) {
                throw trainerProfileErr;
            }

            await loadApplications();
            Alert.alert("Rejected", `${app.full_name}'s application was rejected.`);
        } catch (e: any) {
            Alert.alert("Rejection failed", e?.message || "Please try again.");
        } finally {
            setSavingId(null);
        }
    }

    const filteredApplications = useMemo(() => {
        if (filter === "ALL") return applications;
        return applications.filter((a) => a.status === filter);
    }, [applications, filter]);

    const counts = useMemo(() => {
        return {
            all: applications.length,
            pending: applications.filter((a) => a.status === "PENDING").length,
            approved: applications.filter((a) => a.status === "APPROVED").length,
            rejected: applications.filter((a) => a.status === "REJECTED").length,
        };
    }, [applications]);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: BG,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator size="large" color={ACCENT} />
                <Text style={{ color: MUTED, marginTop: 10 }}>
                    Loading admin dashboard...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={ACCENT}
                    />
                }
            >
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Admin Panel</Text>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.iconBtn}
                        onPress={() => router.replace("../settings")}
                    >
                        <Ionicons name="settings-outline" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.pageTitle}>Trainer Applications</Text>
                <Text style={styles.pageSub}>
                    Review, approve, or reject trainer signups.
                </Text>

                <View style={styles.summaryCard}>
                    <SummaryBox label="All" value={counts.all} />
                    <SummaryBox label="Pending" value={counts.pending} />
                    <SummaryBox label="Approved" value={counts.approved} />
                    <SummaryBox label="Rejected" value={counts.rejected} />
                </View>

                <View style={styles.filterRow}>
                    <FilterPill
                        text="Pending"
                        active={filter === "PENDING"}
                        onPress={() => setFilter("PENDING")}
                    />
                    <FilterPill
                        text="Approved"
                        active={filter === "APPROVED"}
                        onPress={() => setFilter("APPROVED")}
                    />
                    <FilterPill
                        text="Rejected"
                        active={filter === "REJECTED"}
                        onPress={() => setFilter("REJECTED")}
                    />
                    <FilterPill
                        text="All"
                        active={filter === "ALL"}
                        onPress={() => setFilter("ALL")}
                    />
                </View>

                <View style={{ marginTop: 14, gap: 14 }}>
                    {filteredApplications.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                                No applications
                            </Text>
                            <Text style={{ color: MUTED, marginTop: 8 }}>
                                Nothing to review in this filter.
                            </Text>
                        </View>
                    ) : (
                        filteredApplications.map((app) => {
                            const pending = app.status === "PENDING";
                            const isSaving = savingId === app.id;

                            return (
                                <View key={app.id} style={styles.card}>
                                    <View style={styles.topRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cardTitle}>{app.full_name}</Text>
                                            <Text style={styles.cardMeta}>
                                                {app.gender || "N/A"} • {app.age ?? "N/A"} yrs
                                            </Text>
                                        </View>

                                        <StatusBadge status={app.status} />
                                    </View>

                                    <InfoRow label="Certification" value={app.cert_title || "N/A"} />
                                    <InfoRow label="Issuer" value={app.cert_issuer || "N/A"} />
                                    <InfoRow
                                        label="Year"
                                        value={app.cert_year ? String(app.cert_year) : "N/A"}
                                    />
                                    <InfoRow label="Bio" value={app.bio || "No bio provided"} />

                                    <Text style={styles.smallDate}>
                                        Applied: {new Date(app.created_at).toLocaleString()}
                                    </Text>

                                    <View style={styles.fileRow}>
                                        <TouchableOpacity
                                            style={styles.fileBtn}
                                            activeOpacity={0.9}
                                            onPress={() =>
                                                openStorageFile(TRAINER_UPLOADS_BUCKET, app.photo_path, app.user_id)
                                            }
                                        >
                                            <Ionicons
                                                name="image-outline"
                                                size={18}
                                                color={ACCENT}
                                            />
                                            <Text style={styles.fileText}>Photo</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.fileBtn}
                                            activeOpacity={0.9}
                                            onPress={() =>
                                                openStorageFile(TRAINER_UPLOADS_BUCKET, app.certificate_path, app.user_id)
                                            }
                                        >
                                            <Ionicons
                                                name="document-outline"
                                                size={18}
                                                color={ACCENT}
                                            />
                                            <Text style={styles.fileText}>Certificate</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {pending && (
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                style={[
                                                    styles.actionBtn,
                                                    {
                                                        backgroundColor: "#1A3B2A",
                                                        borderColor: "#2A6B45",
                                                    },
                                                ]}
                                                onPress={() => approveApplication(app)}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="checkmark-circle-outline"
                                                            size={18}
                                                            color="#9FF0B6"
                                                        />
                                                        <Text
                                                            style={[styles.actionText, { color: "#9FF0B6" }]}
                                                        >
                                                            Approve
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                style={[
                                                    styles.actionBtn,
                                                    {
                                                        backgroundColor: "#3B1A1A",
                                                        borderColor: "#6B2A2A",
                                                    },
                                                ]}
                                                onPress={() => rejectApplication(app)}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="close-circle-outline"
                                                            size={18}
                                                            color="#FF9A9A"
                                                        />
                                                        <Text
                                                            style={[styles.actionText, { color: "#FF9A9A" }]}
                                                        >
                                                            Reject
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </View>
    );
}

function FilterPill({
    text,
    active,
    onPress,
}: {
    text: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[
                styles.filterPill,
                {
                    backgroundColor: active ? "rgba(255,77,45,0.14)" : "transparent",
                    borderColor: active ? ACCENT : BORDER,
                },
            ]}
        >
            <Text style={{ color: active ? "#FFD3CA" : MUTED, fontWeight: "900" }}>
                {text}
            </Text>
        </TouchableOpacity>
    );
}

function StatusBadge({ status }: { status: Status }) {
    const config =
        status === "APPROVED"
            ? { bg: "rgba(47, 165, 100, 0.18)", border: "#2FA564", text: "#9FF0B6" }
            : status === "REJECTED"
                ? { bg: "rgba(255, 77, 77, 0.16)", border: "#FF6666", text: "#FFB3B3" }
                : { bg: "rgba(255, 173, 51, 0.16)", border: "#FFAD33", text: "#FFD59A" };

    return (
        <View
            style={{
                paddingHorizontal: 10,
                height: 32,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: config.border,
                backgroundColor: config.bg,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Text style={{ color: config.text, fontWeight: "900", fontSize: 12 }}>
                {status}
            </Text>
        </View>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ marginTop: 10 }}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
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
    headerTitle: {
        color: "white",
        fontWeight: "900" as const,
        fontSize: 16,
    },
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
    pageTitle: {
        color: "white",
        fontSize: 28,
        fontWeight: "900" as const,
        marginTop: 18,
    },
    pageSub: {
        color: MUTED,
        marginTop: 6,
    },
    summaryCard: {
        marginTop: 18,
        borderRadius: 20,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
    },
    summaryBox: {
        flex: 1,
        alignItems: "center" as const,
    },
    summaryValue: {
        color: ACCENT,
        fontSize: 22,
        fontWeight: "900" as const,
    },
    summaryLabel: {
        color: MUTED,
        marginTop: 4,
        fontSize: 12,
    },
    filterRow: {
        flexDirection: "row" as const,
        gap: 10,
        marginTop: 14,
        flexWrap: "wrap" as const,
    },
    filterPill: {
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1.2,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    emptyCard: {
        borderRadius: 20,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 20,
        alignItems: "center" as const,
    },
    card: {
        borderRadius: 20,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
    },
    topRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        gap: 12,
    },
    cardTitle: {
        color: "white",
        fontWeight: "900" as const,
        fontSize: 18,
    },
    cardMeta: {
        color: MUTED,
        marginTop: 4,
        fontSize: 12,
    },
    infoLabel: {
        color: "#6B7690",
        fontWeight: "800" as const,
        fontSize: 12,
    },
    infoValue: {
        color: "white",
        marginTop: 4,
        fontSize: 14,
    },
    smallDate: {
        color: MUTED,
        marginTop: 12,
        fontSize: 12,
    },
    fileRow: {
        flexDirection: "row" as const,
        gap: 10,
        marginTop: 14,
    },
    fileBtn: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        gap: 8,
    },
    fileText: {
        color: "white",
        fontWeight: "800" as const,
    },
    actionRow: {
        flexDirection: "row" as const,
        gap: 10,
        marginTop: 16,
    },
    actionBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 8,
    },
    actionText: {
        fontWeight: "900" as const,
        fontSize: 14,
    },
};