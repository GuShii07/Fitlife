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
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!emailRegex.test(email.trim())) return false;
    if (password.trim().length < 1) return false;
    return true;
  }, [email, password]);

  const handleLogin = async () => {
    if (!canSubmit) {
      Alert.alert("Check your details", "Please enter a valid email and password.");
      return;
    }
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error("No user returned");

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("role, trainer_approved")
        .eq("id", userId)
        .single();

      if (profErr) throw profErr;

      if (profile.role === "TRAINER" && !profile.trainer_approved) {
        Alert.alert("Pending approval", "Your trainer account is waiting for admin approval.");
        router.replace("/auth/Login");
        return;
      }

      // route based on role
      if (profile.role === "TRAINER") router.replace("/trainerTabs/dashboard");
      if (profile.role === "ADMIN") router.replace("/admin/admin");
      else router.replace("/userTabs/diet");
    } catch (e: any) {
      Alert.alert("Login failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => router.push("/auth/ChooseRole");

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
        {/* Header row (Back + Title) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={25} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} pointerEvents="none">
            FitLife
          </Text>
        </View>

        {/* Main heading */}
        <Text style={styles.bigTitle}>Welcome back</Text>
        <Text style={styles.subTitle}>Log in to continue your FitLife journey.</Text>

        {/* Email */}
        <Text style={styles.label}>email</Text>
        <TextInput
          placeholder="e.g., you@gmail.com"
          placeholderTextColor="#6B7690"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password with eye toggle */}
        <Text style={[styles.label, { marginTop: 16 }]}>password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#6B7690"
            value={password}
            onChangeText={setPassword}
            style={styles.passwordInput}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={() => setShowPass((s) => !s)}
            activeOpacity={0.85}
            style={styles.eyeBtn}
          >
            <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#D7DEEA" />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          onPress={() => router.push("/auth/ForgotPassword")} style={{ marginTop: 12 }}
        >
          <Text style={{ color: "#9AA6BD", fontWeight: "800" }}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login button */}
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
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Signup link */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 18 }}>
          <Text style={{ color: "#9AA6BD" }}>New to FitLife? </Text>
          <TouchableOpacity onPress={goToSignup} activeOpacity={0.85}>
            <Text style={{ color: "#FFD3CA", fontWeight: "900" }}>Create an account</Text>
          </TouchableOpacity>
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
  passwordWrap: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FF4D2D",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingLeft: 14,
    overflow: "hidden" as const,
  },
  passwordInput: {
    flex: 1,
    height: "100%" as const,
    color: "white",
    paddingRight: 12,
  },
  eyeBtn: {
    width: 48,
    height: 54,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderLeftWidth: 1,
    borderLeftColor: "#FF4D2D",
    backgroundColor: "#111A2C",
  },
  cta: {
    marginTop: 22,
    height: 58,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};