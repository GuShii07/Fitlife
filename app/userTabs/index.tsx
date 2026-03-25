import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("User");
  const [calorieGoal, setCalorieGoal] = useState(1800);

  const [consumed, setConsumed] = useState(0);
  const [foodCount, setFoodCount] = useState(0);

  const [exerciseMins, setExerciseMins] = useState(0);
  const [exerciseCalories, setExerciseCalories] = useState(0);

  const [trainerName, setTrainerName] = useState<string | null>(null);

  const [macros, setMacros] = useState({
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const startISO = todayStart.toISOString();
      const endISO = todayEnd.toISOString();

      // 🔹 PROFILE
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, calorie_goal")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.first_name || "User");
        setCalorieGoal(profile.calorie_goal || 1800);
      }

      // 🔹 DIET LOGS
      const { data: diet } = await supabase
        .from("diet_logs")
        .select("calories, carbs, protein, fat, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      if (diet) {
        const totalCalories = diet.reduce((s, d) => s + (d.calories || 0), 0);
        const carbs = diet.reduce((s, d) => s + (d.carbs || 0), 0);
        const protein = diet.reduce((s, d) => s + (d.protein || 0), 0);
        const fat = diet.reduce((s, d) => s + (d.fat || 0), 0);

        setConsumed(totalCalories);
        setFoodCount(diet.length);
        setMacros({ carbs, protein, fat });
      }

      // 🔹 WORKOUT LOGS
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("total_duration_mins, calories_burned, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      if (workouts) {
        const mins = workouts.reduce((s, w) => s + (w.total_duration_mins || 0), 0);
        const burned = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);

        setExerciseMins(mins);
        setExerciseCalories(burned);
      }

      // 🔹 TRAINER
      const { data: relation } = await supabase
        .from("user_trainers")
        .select("trainer_id, status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();

      if (relation?.trainer_id) {
        const { data: trainer } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", relation.trainer_id)
          .single();

        setTrainerName(trainer?.first_name || "Trainer");
      } else {
        setTrainerName(null);
      }

    } catch (e) {
      console.log("Home error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0F1A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#FF4D2D" />
      </View>
    );
  }

  const remaining = Math.max(0, calorieGoal - consumed);
  const pct = clamp(consumed / calorieGoal, 0, 1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0B0F1A", padding: 16 }}>

      <Text style={{ color: "#FF4D2D", fontSize: 20, fontWeight: "900" }}>
        Hello, {userName}
      </Text>

      <Text style={{ color: "#9AA6BD", marginBottom: 16 }}>
        Welcome to FitLife
      </Text>

      <Text style={{ color: "white", fontWeight: "900" }}>
        {remaining} kcal remaining
      </Text>

      <Text style={{ color: "#9AA6BD" }}>
        Food logs: {foodCount}
      </Text>

      <Text style={{ color: "#9AA6BD" }}>
        Exercise: {exerciseMins} mins / {exerciseCalories} kcal
      </Text>

      <Text style={{ color: "#9AA6BD", marginTop: 10 }}>
        Trainer: {trainerName || "No trainer yet"}
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/userTabs/trainer")}
        style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: "#FF4D2D",
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "900" }}>
          Go to Trainer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}