import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function ResetVerify() {

    const { email } = useLocalSearchParams<{ email: string }>();
    const [code, setCode] = useState("");

    const verify = async () => {

        if (code.length !== 6) {
            Alert.alert("Enter 6 digit code");
            return;
        }

        try {

            const { error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: "email",
            });

            if (error) throw error;

            router.replace("/auth/reset-password");

        } catch (e: any) {
            Alert.alert("Verification failed", e.message);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#0B0F1A" }}>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
                Enter code
            </Text>

            <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                placeholder="123456"
                placeholderTextColor="#6B7690"
                style={{
                    marginTop: 20,
                    borderWidth: 1.5,
                    borderColor: "#FF4D2D",
                    borderRadius: 14,
                    height: 54,
                    paddingHorizontal: 14,
                    color: "white",
                    letterSpacing: 6,
                }}
            />

            <Pressable
                onPress={verify}
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
                    Verify code
                </Text>
            </Pressable>
        </View>
    );
}