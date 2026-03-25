import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

function Item({ icon, title, subtitle, onPress }: any) {
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

export default function TrainerSettings() {
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Logout failed", error.message);
    else router.replace("/auth/Login");
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Trainer Settings</Text>

        <Text style={styles.section}>Trainer Profile</Text>
        <Item
          icon="person-outline"
          title="Edit Profile"
          subtitle="Bio, experience, certifications"
          onPress={() => router.push("/trainerTabs/settings/edit-profile" as any)}
        />
        <Item
          icon="camera-outline"
          title="Change Photo"
          subtitle="Update your avatar"
          onPress={() => router.push("/trainerTabs/settings/edit-profile" as any)}
        />

        <Text style={styles.section}>Business</Text>
        <Item
          icon="cash-outline"
          title="Pricing & Packages"
          subtitle="Plans and session rates"
          onPress={() => router.push("/trainerTabs/settings/packages" as any)}
        />
        <Item
          icon="calendar-outline"
          title="Availability"
          subtitle="Working hours and bookings"
          onPress={() => Alert.alert("Next", "We’ll connect availability after packages.")}
        />

        <Text style={styles.section}>Support</Text>
        <Item icon="help-circle-outline" title="Help Center" onPress={() => Alert.alert("Help", "Coming soon")} />
        <Item icon="mail-outline" title="Contact Support" onPress={() => Alert.alert("Support", "Coming soon")} />

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert("Logout?", "You will be signed out.", [
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0F1A" },
  container: { padding: 16, paddingBottom: 20 },
  title: { color: "white", fontSize: 28, fontWeight: "900", marginTop: 40, marginBottom: 18 },
  section: { color: "#FF4D2D", fontWeight: "900", marginTop: 18, marginBottom: 10 },
  item: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, backgroundColor: "#0F1627", borderWidth: 1, borderColor: "#1F2A44", marginBottom: 10 },
  itemTitle: { color: "white", fontWeight: "900" },
  itemSub: { color: "#9AA6BD", fontSize: 12, marginTop: 2 },
  logoutBtn: { marginTop: 26, height: 56, borderRadius: 16, backgroundColor: "#FF4D2D", alignItems: "center", justifyContent: "center" },
  logoutText: { color: "white", fontWeight: "900", fontSize: 16 },
});