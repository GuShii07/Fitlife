import { Stack } from "expo-router";
import React from "react";

export default function TrainerLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="browse" />
            <Stack.Screen name="[id]" />
            <Stack.Screen name="hire" />
            <Stack.Screen name="requests" />
            <Stack.Screen name="my-trainer" />
        </Stack>
    );
}