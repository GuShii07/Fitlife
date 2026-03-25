// app/auth/Login.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!emailRegex.test(email.trim())) return false;
    return true;
  }, [email]);

  const handleLogin = async () => {
    if (!canSubmit || loading) {
      Alert.alert(
        "Check your details",
        "Please enter a valid email.",
      );
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      router.push({
        pathname: "/auth/VerifyOtp",
        params: {
          email: cleanEmail,
          mode: "login",
        },
      });
    } catch (e: any) {
      Alert.alert("Login failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => router.push("/auth/ChooseRole");
//   const changeEmailHardcoded = async () => {
//   try {
//     const { data, error } = await supabase.functions.invoke("update-email", {
//       body: {
//         userId: "eb39a499-2b20-4863-9029-847eb86847df",
//         newEmail: "amagar675@gmail.com",
//       },
//     });

//     if (error) throw error;

//     const { error: profileError } = await supabase
//       .from("profiles")
//       .update({ email: "amagar@gmail.com" })
//       .eq("id", "eb39a499-2b20-4863-9029-847eb86847df");

//     if (profileError) throw profileError;

//     Alert.alert("Success", "Email updated successfully");
//   } catch (err: any) {
//     Alert.alert("Error", err.message || "Something went wrong");
//   }
// };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B0F1A" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back-outline" size={25} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} pointerEvents="none">
            FitLife
          </Text>
        </View>

        <Text style={styles.bigTitle}>Welcome back</Text>
        <Text style={styles.subTitle}>
          Log in with a one-time code sent to your email.
        </Text>

        <Text style={styles.label}>email</Text>
        <TextInput
          placeholder="e.g., you@gmail.com"
          placeholderTextColor="#6B7690"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={!canSubmit || loading}
          activeOpacity={0.9}
          style={[
            styles.cta,
            { backgroundColor: !canSubmit || loading ? "#2A3550" : "#FF4D2D" },
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
              Send OTP
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 18,
          }}
        >
          <Text style={{ color: "#9AA6BD" }}>New to FitLife? </Text>
          <TouchableOpacity onPress={goToSignup} activeOpacity={0.85}>
            <Text style={{ color: "#FFD3CA", fontWeight: "900" }}>
              Create an account
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={changeEmailHardcoded} >
  <Text style={{color: "#9AA6BD"}}>Change Email (Test)</Text>
</TouchableOpacity> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginTop: 30,
  },
  headerTitle: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    textAlign: "center" as const,
    color: "#FF4D2D",
    fontWeight: "800" as const,
    fontSize: 18,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#111A2C",
    borderWidth: 1,
    borderColor: "#1F2A44",
    zIndex: 2,
  },
  bigTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "800" as const,
    marginTop: 18,
    lineHeight: 40,
  },
  subTitle: {
    color: "#9AA6BD",
    marginTop: 4,
    fontSize: 14,
  },
  label: {
    color: "#6B7690",
    fontWeight: "800" as const,
    textTransform: "lowercase" as const,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: "white",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#FF4D2D",
  },
  cta: {
    marginTop: 22,
    height: 58,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
