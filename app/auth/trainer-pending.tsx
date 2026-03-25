import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function TrainerPending() {
    const logout = async () => {
        await supabase.auth.signOut();
        router.replace("/auth/Login");
    };

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#0B0F1A",
                padding: 24,
                justifyContent: "center",
            }}
        >
            <Text style={{ color: "#FF4D2D", fontSize: 30, fontWeight: "900" }}>
                Application Pending
            </Text>

            <Text style={{ color: "#9AA6BD", marginTop: 12, fontSize: 15, lineHeight: 24 }}>
                Your trainer application has been submitted successfully.
                {"\n\n"}
                An admin needs to review and approve your documents before you can access trainer features.
            </Text>

            <TouchableOpacity
                onPress={logout}
                activeOpacity={0.9}
                style={{
                    marginTop: 28,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: "#FF4D2D",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                    Logout
                </Text>
            </TouchableOpacity>
        </View>
    );
}