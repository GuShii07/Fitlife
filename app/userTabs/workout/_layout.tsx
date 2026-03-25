import { Stack } from "expo-router";
import React from "react";

export default function WorkoutStackLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="browse" />
            <Stack.Screen name="log" />
            <Stack.Screen name="challenges" />
            <Stack.Screen name="pushup" />
            <Stack.Screen name="leaderboard" />
            <Stack.Screen name="details" />
        </Stack>
    );
}