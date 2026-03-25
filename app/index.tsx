import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Index() {
    const [target, setTarget] = useState<string | null>(null);

    useEffect(() => {
        init();
    }, []);

    async function init() {
        try {
            const { data: sessionData } = await supabase.auth.getSession();

            const user = sessionData?.session?.user;

            if (!user) {
                setTarget("/auth/Login");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role, trainer_approved")
                .eq("id", user.id)
                .single();

            if (error || !profile) {
                setTarget("/auth/Login");
                return;
            }

            // 🔥 ROLE BASED ROUTING
            if (profile.role === "ADMIN") {
                setTarget("/admin/admin");
                return;
            }

            if (profile.role === "TRAINER" && profile.trainer_approved === false) {
                setTarget("/trainerTabs/pending");
                return;
            }

            if (profile.role === "TRAINER" && profile.trainer_approved === true) {
                setTarget("/trainerTabs/dashboard");
                return;
            }

            if (profile.role === "USER") {
                setTarget("/userTabs/diet");
                return;
            }

            // Fallback for no role
            setTarget("/onboarding");
        } catch (e) {
            console.log("INDEX ERROR:", e);
            setTarget("/auth/Login");
        }
    }

    // 🔥 SAFE LOADING UI (prevents white screen)
    if (!target) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: "#0B0F1A",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator size="large" color="#FF4D2D" />
                <Text style={{ color: "#9AA6BD", marginTop: 10 }}>
                    Loading FitLife...
                </Text>
            </View>
        );
    }

    return <Redirect href={target as any} />;
}
