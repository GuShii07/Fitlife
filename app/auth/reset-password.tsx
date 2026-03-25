import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
    const params = useLocalSearchParams<{ fromSignup?: string; next?: string }>();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(() => {
        if (password.length < 8) return false;
        if (password !== confirm) return false;
        return true;
    }, [password, confirm]);

    const updatePassword = async () => {
        if (loading || !canSubmit) {
            return;
        }

        setLoading(true);

        const isFromSignup = params.fromSignup === "1";
        const nextPath = typeof params.next === "string" && params.next.trim() ? params.next : "/auth/Login";

        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) {
                Alert.alert("Failed", error.message);
                return;
            }

            if (isFromSignup) {
                Alert.alert("Password set", "Account secured. Continuing...");
                router.replace(nextPath as any);
                return;
            }

            Alert.alert("Password updated");
            router.replace("/auth/Login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#0B0F1A", justifyContent: "center" }}>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Set new password</Text>
            <Text style={{ color: "#9AA6BD", marginTop: 6 }}>
                Choose a new password for your account.
            </Text>

            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="New password (min 8 chars)"
                placeholderTextColor="#6B7690"
                secureTextEntry
                style={{
                    marginTop: 18,
                    height: 54,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    color: "white",
                    fontWeight: "800",
                    borderWidth: 1.5,
                    borderColor: "#FF4D2D",
                }}
            />

            <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm password"
                placeholderTextColor="#6B7690"
                secureTextEntry
                style={{
                    marginTop: 12,
                    height: 54,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    color: "white",
                    fontWeight: "800",
                    borderWidth: 1.5,
                    borderColor: "#FF4D2D",
                }}
            />

            <Pressable
                onPress={updatePassword}
                disabled={loading || !canSubmit}
                style={{
                    marginTop: 16,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: loading || !canSubmit ? "#2A3550" : "#FF4D2D",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                    {loading ? "Updating..." : "Update password"}
                </Text>
            </Pressable>
        </View>
    );
}
