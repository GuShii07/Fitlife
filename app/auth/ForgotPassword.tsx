import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const sendCode = async () => {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            Alert.alert("Enter email");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: cleanEmail,
                options: {
                    shouldCreateUser: false,
                },
            });

            if (error) throw error;

            router.push({
                pathname: "/auth/reset-verify",
                params: { email: cleanEmail },
            });

        } catch (e: any) {
            Alert.alert("Failed", e.message);
        }

        setLoading(false);
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#0B0F1A" }}>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
                Reset password
            </Text>

            <TextInput
                placeholder="Enter email"
                placeholderTextColor="#6B7690"
                value={email}
                onChangeText={setEmail}
                style={{
                    marginTop: 20,
                    borderWidth: 1.5,
                    borderColor: "#FF4D2D",
                    borderRadius: 14,
                    height: 54,
                    paddingHorizontal: 14,
                    color: "white",
                }}
            />

            <Pressable
                onPress={sendCode}
                style={{
                    marginTop: 20,
                    backgroundColor: "#FF4D2D",
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Text style={{ color: "white", fontWeight: "900" }}>
                    Send code
                </Text>
            </Pressable>
        </View>
    );
}