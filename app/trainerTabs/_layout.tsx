import { Ionicons } from "@expo/vector-icons";
import { router, Tabs, useFocusEffect, usePathname } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../../lib/supabase";

const ORANGE = "#FF4D2D";
const MUTED = "#9AA6BD";
const BG = "#0B0F1A";

export default function TrainerTabsLayout() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        setApproved(false);
        router.replace("/auth/Login");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role, trainer_approved")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const isTrainer = profile?.role === "TRAINER";
      const isApproved = isTrainer && Boolean(profile?.trainer_approved);

      setApproved(isApproved);

      if (!isTrainer) {
        router.replace("/auth/Login");
        return;
      }

      if (!isApproved && pathname !== "/trainerTabs/pending") {
        router.replace("/trainerTabs/pending");
        return;
      }

      if (isApproved && pathname === "/trainerTabs/pending") {
        router.replace("/trainerTabs/dashboard");
      }
    } catch {
      router.replace("/auth/Login");
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useFocusEffect(
    useCallback(() => {
      checkAccess();
    }, [checkAccess]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: approved ? "flex" : "none",
          backgroundColor: BG,
          borderTopColor: "#1F2A44",
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: MUTED,
      }}
    >
      <Tabs.Screen
        name="pending"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: approved ? "/trainerTabs/dashboard" : null,
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: approved ? "/trainerTabs/clients" : null,
          title: "Clients",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          href: approved ? "/trainerTabs/earnings" : null,
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: approved ? "/trainerTabs/settings" : null,
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
