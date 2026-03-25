// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        // ✅ More bottom padding + safe area support
        tabBarStyle: {
          backgroundColor: "#08100C",
          borderTopColor: "#1F2A44",
          borderTopWidth: 1,

          // Increase overall height so it doesn't feel cramped
          height: 50 + insets.bottom,

          // Top/bottom padding
          paddingTop: 10,
          paddingBottom: 16 + insets.bottom,
        },

        tabBarActiveTintColor: "#FF4D2D",
        tabBarInactiveTintColor: "#BBC9E4",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },

        tabBarIcon: ({ color, focused }) => {
          const iconSize = focused ? 22 : 20;

          let iconName: any = "home-outline";

          // ✅ Home route is "index" (so it stays first + default)
          if (route.name === "index") iconName = focused ? "home" : "home-outline";
          if (route.name === "diet") iconName = focused ? "nutrition" : "nutrition-outline";
          if (route.name === "workout") iconName = focused ? "barbell" : "barbell-outline";
          if (route.name === "trainer") iconName = focused ? "people" : "people-outline";

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      {/* ✅ Home FIRST + default */}
      <Tabs.Screen name="index" options={{ title: "Home" }} />

      <Tabs.Screen name="diet" options={{ title: "Diet" }} />
      <Tabs.Screen name="workout" options={{ title: "Workout" }} />
      <Tabs.Screen name="trainer" options={{ title: "Trainer" }} />
    </Tabs>
  );
}
