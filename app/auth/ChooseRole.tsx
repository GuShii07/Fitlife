import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

type Role = "user" | "trainer";

export default function ChooseRole() {
  const navigation = useNavigation();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
    });
  }, [navigation]);

  const confirm = () => {
    if (!role) {
      Alert.alert("Choose a role", "Please select User or Trainer to continue.");
      return;
    }
    if (role === "user") router.push("/auth/Signup");
    else router.push("/auth/TrainerSignup");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <View style={{ flex: 1, padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 30 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back-outline" size={25} color="white" />
          </TouchableOpacity>

          <Text pointerEvents="none" style={styles.headerTitle}>
            Welcome to FitLife
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.bigTitle}>Continue as</Text>
        <Text style={styles.subTitle}>
          Choose your role. Users track fitness, trainers apply to coach and get hired.
        </Text>

        {/* Options */}
        <View style={{ marginTop: 26, gap: 14 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setRole("user")}
            style={[
              styles.roleCard,
              {
                borderColor: role === "user" ? "#FF4D2D" : "#24314E",
                backgroundColor: role === "user" ? "rgba(255,77,45,0.10)" : "rgba(17,26,44,0.35)",
              },
            ]}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: role === "user" ? "#FF4D2D" : "#111A2C" }]}>
              <Ionicons name="person-outline" size={22} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>User</Text>
              <Text style={styles.roleDesc}>Track workouts, meals, and progress.</Text>
            </View>

            <Ionicons
              name={role === "user" ? "checkmark-circle" : "chevron-forward"}
              size={20}
              color={role === "user" ? "#FF4D2D" : "#9AA6BD"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setRole("trainer")}
            style={[
              styles.roleCard,
              {
                borderColor: role === "trainer" ? "#FF4D2D" : "#24314E",
                backgroundColor: role === "trainer" ? "rgba(255,77,45,0.10)" : "rgba(17,26,44,0.35)",
              },
            ]}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: role === "trainer" ? "#FF4D2D" : "#111A2C" }]}>
              <Ionicons name="fitness-outline" size={22} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>Trainer</Text>
              <Text style={styles.roleDesc}>Apply to coach users & get hired.</Text>
            </View>

            <Ionicons
              name={role === "trainer" ? "checkmark-circle" : "chevron-forward"}
              size={20}
              color={role === "trainer" ? "#FF4D2D" : "#9AA6BD"}
            />
          </TouchableOpacity>
        </View>

        {/* Tip */}
        <View style={styles.tipBox}>
          <Ionicons name="information-circle-outline" size={18} color="#9AA6BD" />
          <Text style={styles.tipText}>
            Trainers will need to upload certification for verification.
          </Text>
        </View>
      </View>

      {/* ✅ Fixed bottom Confirm button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={confirm}
          activeOpacity={0.9}
          disabled={!role}
          style={[
            styles.cta,
            { backgroundColor: !role ? "#2A3550" : "#FF4D2D" },
          ]}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
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
  headerTitle: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    textAlign: "center" as const,
    color: "#FF4D2D",
    fontWeight: "800" as const,
    fontSize: 18,
  },
  bigTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "800" as const,
    marginTop: 22,
    lineHeight: 40,
  },
  subTitle: {
    color: "#9AA6BD",
    marginTop: 6,
    fontSize: 14,
    maxWidth: 520,
  },
  roleCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  roleTitle: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 16,
  },
  roleDesc: {
    color: "#9AA6BD",
    marginTop: 2,
    fontSize: 12,
  },
  tipBox: {
    marginTop: 22,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
    backgroundColor: "#0F1627",
  },
  tipText: {
    color: "#9AA6BD",
    fontSize: 12,
    flex: 1,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: "#0B0F1A",
    borderTopWidth: 1,
    borderTopColor: "#1F2A44",
  },
  cta: {
    height: 58,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};