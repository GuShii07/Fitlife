import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

type ItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  role: "USER" | "TRAINER" | "ADMIN" | null;
  gender: string | null;
  age: number | null;
  height: number | null;
  height_unit: string | null;
  current_weight: number | null;
  goal_weight: number | null;
  goal_type: string | null;
  activity_level: string | null;
  calorie_goal: number | null;
  trainer_approved: boolean | null;
  trainer_status: string | null;
};

function Item({ icon, title, subtitle, onPress }: ItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.item}>
      <Ionicons name={icon} size={20} color="#FF4D2D" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.itemSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9AA6BD" />
    </TouchableOpacity>
  );
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        router.replace("/auth/Login");
        return;
      }

      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,email,first_name,role,gender,age,height,height_unit,current_weight,goal_weight,goal_type,activity_level,calorie_goal,trainer_approved,trainer_status"
        )
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data as ProfileRow);
    } catch (e: any) {
      Alert.alert("Failed to load settings", e?.message ?? "Try again");
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth/Login");
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Try again");
    }
  };

  const notReady = () => Alert.alert("Coming soon", "We’ll connect this screen next.");

  const displayName = profile?.first_name || "No name set";
  const profileSubtitle = [displayName, email].filter(Boolean).join(" • ");

  const goalsSubtitle = [
    profile?.goal_type ? prettyGoal(profile.goal_type) : null,
    profile?.calorie_goal ? `${profile.calorie_goal} kcal/day` : null,
    profile?.goal_weight ? `${profile.goal_weight}${profile?.height_unit === "lb" ? " lb" : profile?.goal_weight ? ` ${profile?.current_weight && profile?.goal_weight ? (profile?.current_weight > 0 ? "" : "") : ""}` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const weightSubtitle = [
    profile?.current_weight ? `Current: ${profile.current_weight} ${profile?.role ? weightUnitFromProfile(profile) : ""}` : null,
    profile?.height ? `Height: ${profile.height} ${profile.height_unit ?? ""}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const trainerSubtitle =
    profile?.role === "TRAINER"
      ? `${profile.trainer_approved ? "Approved trainer" : "Pending trainer approval"}${profile?.trainer_status ? ` • ${capitalize(profile.trainer_status)}` : ""
      }`
      : undefined;

  if (loading) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color="#FF4D2D" size="large" />
        <Text style={{ color: "#9AA6BD", marginTop: 10 }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={26} color="#FF4D2D" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileMeta}>{email || "No email found"}</Text>
            {profile?.role ? <Text style={styles.roleBadge}>{profile.role}</Text> : null}
          </View>
        </View>
        {profile?.role === "USER" && (
          <>
            <Text style={styles.section}>Profile</Text>
            <Item icon="person-outline" title="Edit Profile" subtitle={profileSubtitle} onPress={notReady} />
            <Item icon="camera-outline" title="Change Photo" subtitle="Update your avatar" onPress={notReady} />
            <Item
              icon="flag-outline"
              title="Goals & Targets"
              subtitle={goalsSubtitle || "Weight goal, activity goal"}
              onPress={notReady}
            />
            <Item
              icon="scale-outline"
              title="Weight & Body Metrics"
              subtitle={weightSubtitle || "Weight, height, measurements"}
              onPress={notReady}
            />
            <Item
              icon="speedometer-outline"
              title="Activity Level"
              subtitle={profile?.activity_level ? prettyActivity(profile.activity_level) : "Sedentary, active, etc."}
              onPress={notReady}
            />
          </>
        )}


        {profile?.role === "TRAINER" && (
          <>
            <Text style={styles.section}>Trainer</Text>
            <Item
              icon="fitness-outline"
              title="Trainer Status"
              subtitle={trainerSubtitle || "Trainer profile details"}
              onPress={notReady}
            />
          </>
        )}

        {profile?.role === "ADMIN" && (
          <>
            <Text style={styles.section}>Admin</Text>
          </>
        )}

        <Text style={styles.section}>Privacy & Security</Text>
        <Item icon="lock-closed-outline" title="Change Password" subtitle="Secure your account" onPress={notReady} />
        <Item icon="shield-checkmark-outline" title="Data & Privacy" subtitle="Manage your data" onPress={notReady} />
        <Item icon="download-outline" title="Export My Data" subtitle="Download your data" onPress={notReady} />

        <Text style={styles.section}>Support</Text>
        <Item icon="help-circle-outline" title="Help Center" subtitle="FAQs & guides" onPress={notReady} />
        <Item icon="mail-outline" title="Contact Support" subtitle="Report issues" onPress={notReady} />
        <Item icon="document-text-outline" title="Terms & Policies" subtitle="Legal information" onPress={notReady} />

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert("Logout?", "You will be signed out of FitLife.", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])
          }
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function prettyGoal(goal: string) {
  switch (goal) {
    case "lose_weight":
      return "Lose weight";
    case "gain_muscle":
      return "Gain muscle";
    case "stay_fit":
      return "Stay fit";
    case "endurance":
      return "Improve endurance";
    default:
      return goal;
  }
}

function prettyActivity(activity: string) {
  switch (activity) {
    case "sedentary":
      return "Sedentary";
    case "lightly_active":
      return "Lightly active";
    case "moderately_active":
      return "Moderately active";
    case "very_active":
      return "Very active";
    case "extra_active":
      return "Extra active";
    default:
      return activity;
  }
}

function capitalize(text: string) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function weightUnitFromProfile(profile: ProfileRow) {
  return profile?.current_weight ? profile?.height_unit === "ft" ? "lb" : "kg" : "";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  container: {
    padding: 16,
    paddingBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 40,
    marginBottom: 18,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#0F1627",
    borderWidth: 1,
    borderColor: "#1F2A44",
    marginBottom: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.25)",
  },
  profileName: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  profileMeta: {
    color: "#9AA6BD",
    fontSize: 12,
    marginTop: 4,
  },
  roleBadge: {
    color: "#FFD3CA",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 8,
  },
  section: {
    color: "#FF4D2D",
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#0F1627",
    borderWidth: 1,
    borderColor: "#1F2A44",
    marginBottom: 10,
  },
  itemTitle: {
    color: "white",
    fontWeight: "900",
  },
  itemSub: {
    color: "#9AA6BD",
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 26,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FF4D2D",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
});