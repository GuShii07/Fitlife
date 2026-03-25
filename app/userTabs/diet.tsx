// app/(tabs)/diet.tsx
// Diet page — original design preserved
// ✅ Uses Supabase food_database for searchable foods
// ✅ Uses Supabase diet_logs for user meal logs
// ✅ Uses profiles.calorie_goal for target calories
// ✅ Dynamic meal cards
// ✅ Add Food search modal
// ✅ Tap meal card to open Meal Details modal
// ✅ Delete single food
// ✅ Clear entire meal

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { supabase } from "../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type MealKey = string;

type FoodItem = {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

type DietLogRow = {
  id: string;
  user_id: string;
  meal_key: string;
  food_name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  created_at?: string;
};

export default function Diet() {
  const [userId, setUserId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  const [foodDb, setFoodDb] = useState<FoodItem[]>([]);

  const [meals, setMeals] = useState<{ key: MealKey; title: string; image?: any }[]>([
    { key: "breakfast", title: "Breakfast", image: require("../../assets/Diet/Breakfast.png") },
    { key: "lunch", title: "Lunch", image: require("../../assets/Diet/Lunch.png") },
    { key: "dinner", title: "Dinner", image: require("../../assets/Diet/Dinner.png") },
    { key: "snacks", title: "Snacks", image: require("../../assets/Diet/Snacks.png") },
  ]);

  const [mealFoods, setMealFoods] = useState<Record<MealKey, FoodItem[]>>({});

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMealKey, setActiveMealKey] = useState<MealKey | null>(null);
  const [activeMealTitle, setActiveMealTitle] = useState<string>("");
  const [query, setQuery] = useState("");

  const [isMealDetailOpen, setIsMealDetailOpen] = useState(false);
  const [detailMealKey, setDetailMealKey] = useState<MealKey | null>(null);
  const [detailMealTitle, setDetailMealTitle] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setPageLoading(true);

        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw userErr;

        if (!user) {
          Alert.alert("Not logged in", "Please log in first.");
          return;
        }

        setUserId(user.id);

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("calorie_goal")
          .eq("id", user.id)
          .single();

        if (!profileErr && profile?.calorie_goal) {
          setCalorieGoal(Number(profile.calorie_goal));
        }

        await loadFoodDatabase();
        await loadDietLogs(user.id);
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load diet data.");
      } finally {
        setPageLoading(false);
      }
    };

    run();
  }, []);

  async function loadFoodDatabase() {
    const { data, error } = await supabase
      .from("food_database")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    const mapped: FoodItem[] = (data || []).map((row: any) => ({
      id: String(row.id),
      name: row.serving_size ? `${row.name} (${row.serving_size})` : row.name,
      calories: Number(row.calories ?? 0),
      carbs: Number(row.carbs ?? 0),
      protein: Number(row.protein ?? 0),
      fat: Number(row.fat ?? 0),
    }));

    setFoodDb(mapped);
  }

  async function loadDietLogs(uid: string) {
    const { data, error } = await supabase
      .from("diet_logs")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const grouped: Record<MealKey, FoodItem[]> = {};

    (data as DietLogRow[] | null)?.forEach((row) => {
      if (!grouped[row.meal_key]) grouped[row.meal_key] = [];

      grouped[row.meal_key].push({
        id: row.id,
        name: row.food_name,
        calories: Number(row.calories ?? 0),
        carbs: Number(row.carbs ?? 0),
        protein: Number(row.protein ?? 0),
        fat: Number(row.fat ?? 0),
      });
    });

    setMealFoods(grouped);
  }

  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foodDb;
    return foodDb.filter((f) => f.name.toLowerCase().includes(q));
  }, [query, foodDb]);

  function openSearch(mealKey: MealKey, mealTitle: string) {
    setActiveMealKey(mealKey);
    setActiveMealTitle(mealTitle);
    setQuery("");
    setIsSearchOpen(true);
  }

  async function addFoodToMeal(food: FoodItem) {
    if (!activeMealKey || !userId) return;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from("diet_logs")
        .insert({
          user_id: userId,
          meal_key: activeMealKey,
          food_name: food.name,
          calories: food.calories,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
        })
        .select()
        .single();

      if (error) throw error;

      const inserted = data as DietLogRow;

      const newFood: FoodItem = {
        id: inserted.id,
        name: inserted.food_name,
        calories: Number(inserted.calories ?? 0),
        carbs: Number(inserted.carbs ?? 0),
        protein: Number(inserted.protein ?? 0),
        fat: Number(inserted.fat ?? 0),
      };

      setMealFoods((prev) => {
        const list = prev[activeMealKey] ?? [];
        return { ...prev, [activeMealKey]: [newFood, ...list] };
      });

      setIsSearchOpen(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to add food.");
    } finally {
      setSaving(false);
    }
  }

  function addMoreMealCard() {
    const nextIndex = meals.length + 1;
    const key = `meal_${Date.now()}`;
    setMeals((prev) => [...prev, { key, title: `Meal ${nextIndex}` }]);
  }

  function openMealDetails(mealKey: MealKey, mealTitle: string) {
    setDetailMealKey(mealKey);
    setDetailMealTitle(mealTitle);
    setIsMealDetailOpen(true);
  }

  async function removeFoodFromMeal(mealKey: MealKey, index: number) {
    const food = mealFoods[mealKey]?.[index];
    if (!food) return;

    try {
      const { error } = await supabase.from("diet_logs").delete().eq("id", food.id);
      if (error) throw error;

      setMealFoods((prev) => {
        const list = [...(prev[mealKey] ?? [])];
        list.splice(index, 1);
        return { ...prev, [mealKey]: list };
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to delete food.");
    }
  }

  async function clearMeal(mealKey: MealKey) {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("diet_logs")
        .delete()
        .eq("user_id", userId)
        .eq("meal_key", mealKey);

      if (error) throw error;

      setMealFoods((prev) => ({ ...prev, [mealKey]: [] }));
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to clear meal.");
    }
  }

  const detailFoods = detailMealKey ? mealFoods[detailMealKey] ?? [] : [];

  const allFoods = useMemo(() => Object.values(mealFoods).flat(), [mealFoods]);

  const eaten = useMemo(
    () => Math.round(allFoods.reduce((sum, f) => sum + Number(f.calories || 0), 0)),
    [allFoods]
  );

  const total = calorieGoal;
  const remaining = Math.max(total - eaten, 0);

  const carbsTotal = useMemo(
    () => allFoods.reduce((sum, f) => sum + Number(f.carbs || 0), 0),
    [allFoods]
  );
  const proteinTotal = useMemo(
    () => allFoods.reduce((sum, f) => sum + Number(f.protein || 0), 0),
    [allFoods]
  );
  const fatTotal = useMemo(
    () => allFoods.reduce((sum, f) => sum + Number(f.fat || 0), 0),
    [allFoods]
  );

  const macroCalories = carbsTotal * 4 + proteinTotal * 4 + fatTotal * 9;
  const carbsPct = macroCalories > 0 ? (carbsTotal * 4) / macroCalories : 0;
  const proteinPct = macroCalories > 0 ? (proteinTotal * 4) / macroCalories : 0;
  const fatPct = macroCalories > 0 ? (fatTotal * 9) / macroCalories : 0;

  if (pageLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0F1A", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={{ color: MUTED, marginTop: 10 }}>Loading diet...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Diet</Text>
            <Text style={styles.welcome}>Track meals, calories, and macros.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        <View style={styles.bigCard}>
          <View style={styles.bigCardInner}>
            <View style={styles.sideStat}>
              <Text style={styles.sideNumber}>{eaten}</Text>
              <Text style={styles.sideLabel}>Eaten</Text>
            </View>

            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <SemiRing size={118} stroke={10} progress={total > 0 ? eaten / total : 0} />
              <View style={styles.ringCenterText}>
                <Text style={styles.ringNumber}>{total}cal</Text>
                <Text style={styles.ringSub}>Total</Text>
              </View>
            </View>

            <View style={styles.sideStat}>
              <Text style={styles.sideNumber}>{remaining}</Text>
              <Text style={styles.sideLabel}>Remaining</Text>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <Macro label="Carbs" pct={carbsPct} />
            <Macro label="Protein" pct={proteinPct} />
            <Macro label="Fat" pct={fatPct} />
          </View>
        </View>

        <View style={{ marginTop: 14, gap: 12 }}>
          {meals.map((m) => (
            <MealCard
              key={m.key}
              title={m.title}
              image={m.image}
              foodsCount={(mealFoods[m.key] ?? []).length}
              onPress={() => openMealDetails(m.key, m.title)}
              onMore={() => openSearch(m.key, m.title)}
            />
          ))}

          <LogMoreFoodCard onPress={addMoreMealCard} />
        </View>
      </ScrollView>

      <FoodSearchModal
        visible={isSearchOpen}
        title={activeMealTitle || "Add Food"}
        query={query}
        setQuery={setQuery}
        foods={filteredFoods}
        saving={saving}
        onClose={() => setIsSearchOpen(false)}
        onSelectFood={addFoodToMeal}
      />

      <MealDetailsModal
        visible={isMealDetailOpen}
        title={detailMealTitle || "Meal details"}
        foods={detailFoods}
        onClose={() => setIsMealDetailOpen(false)}
        onDeleteFood={(index) => {
          if (!detailMealKey) return;
          removeFoodFromMeal(detailMealKey, index);
        }}
        onClearMeal={() => {
          if (!detailMealKey) return;
          clearMeal(detailMealKey);
        }}
      />
    </View>
  );
}

function MealCard({
  title,
  image,
  foodsCount,
  onPress,
  onMore,
}: {
  title: string;
  image?: any;
  foodsCount: number;
  onPress: () => void;
  onMore: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.mealCard}>
      <View style={styles.mealImgWrap}>
        {image ? <Image source={image} style={styles.mealImg} /> : <View style={styles.mealImgPlaceholder} />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.mealTitle}>{title}</Text>
        <Text style={styles.mealSub}>{foodsCount > 0 ? `${foodsCount} item(s) added` : "No food added yet"}</Text>
      </View>

      <TouchableOpacity activeOpacity={0.9} style={styles.mealMoreBtn} onPress={onMore}>
        <Ionicons name="add" size={30} color="#C7CFDD" />
      </TouchableOpacity>
    </Pressable>
  );
}

function LogMoreFoodCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.logMoreCard}>
      <View style={styles.logMoreIconWrap}>
        <Ionicons name="add" size={20} color="white" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.logMoreTitle}>Log more food</Text>
        <Text style={styles.logMoreSub}>Add more meals other than mentioned</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#C7CFDD" />
    </TouchableOpacity>
  );
}

function FoodSearchModal({
  visible,
  title,
  query,
  setQuery,
  foods,
  saving,
  onClose,
  onSelectFood,
}: {
  visible: boolean;
  title: string;
  query: string;
  setQuery: (v: string) => void;
  foods: FoodItem[];
  saving: boolean;
  onClose: () => void;
  onSelectFood: (f: FoodItem) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={18} color="white" />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color="#C7CFDD" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search food (e.g., rice, chicken, banana)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.searchInput}
              autoFocus
            />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
            {foods.map((f) => (
              <TouchableOpacity
                key={f.id}
                activeOpacity={0.9}
                style={styles.foodRow}
                onPress={() => onSelectFood(f)}
                disabled={saving}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{f.name}</Text>
                  <Text style={styles.foodMeta}>
                    {f.calories} kcal • C {f.carbs}g • P {f.protein}g • F {f.fat}g
                  </Text>
                </View>
                <View style={styles.foodAddBtn}>
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="add" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {foods.length === 0 && (
              <View style={{ paddingVertical: 22, alignItems: "center" }}>
                <Text style={{ color: MUTED }}>No results found.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MealDetailsModal({
  visible,
  title,
  foods,
  onClose,
  onDeleteFood,
  onClearMeal,
}: {
  visible: boolean;
  title: string;
  foods: FoodItem[];
  onClose: () => void;
  onDeleteFood: (index: number) => void;
  onClearMeal: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop1}>
        <Pressable style={styles.backdropTap} onPress={onClose} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={18} color="white" />
            </Pressable>
          </View>

          {foods.length > 0 && (
            <TouchableOpacity activeOpacity={0.9} onPress={onClearMeal} style={styles.clearMealBtn}>
              <Text style={styles.clearMealText}>Clear this meal</Text>
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            {foods.length === 0 ? (
              <View style={{ paddingVertical: 26, alignItems: "center" }}>
                <Text style={{ color: MUTED }}>No food added yet.</Text>
              </View>
            ) : (
              foods.map((f, idx) => (
                <View key={`${f.id}_${idx}`} style={styles.detailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{f.name}</Text>
                    <Text style={styles.detailMeta}>
                      {f.calories} kcal • C {f.carbs}g • P {f.protein}g • F {f.fat}g
                    </Text>
                  </View>

                  <TouchableOpacity activeOpacity={0.9} onPress={() => onDeleteFood(idx)} style={styles.trashBtn}>
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Macro({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${Math.round(clamp(pct, 0, 1) * 100)}%` }]} />
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function SemiRing({
  size,
  stroke,
  progress,
}: {
  size: number;
  stroke: number;
  progress: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const visiblePortion = 0.65;
  const arcLen = c * visiblePortion;

  const filled = arcLen * clamp(progress, 0, 1);
  const empty = arcLen - filled;

  const gap = c - arcLen;
  const rotation = -210;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${gap}`}
        rotation={rotation}
        originX={size / 2}
        originY={size / 2}
        opacity={0.8}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={ACCENT}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${empty + gap}`}
        rotation={rotation}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const styles = {
  headerCard: {
    marginTop: 40,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },
  hello: { color: ACCENT, fontWeight: "900" as const, fontSize: 18 },
  welcome: { color: MUTED, marginTop: 2, fontSize: 12 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "transparent",
  },

  bigCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  bigCardInner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  sideStat: { width: 86, alignItems: "center" as const },
  sideNumber: { color: "white", fontWeight: "900" as const, fontSize: 16 },
  sideLabel: { color: "#C7CFDD", fontSize: 12, marginTop: 6, opacity: 0.85 },

  ringCenterText: { position: "absolute" as const, alignItems: "center" as const, justifyContent: "center" as const },
  ringNumber: { color: "white", fontWeight: "900" as const, fontSize: 16 },
  ringSub: { color: "#C7CFDD", fontSize: 12, marginTop: 2, opacity: 0.85 },

  macrosRow: { flexDirection: "row" as const, gap: 12, marginTop: 12, paddingHorizontal: 6, paddingBottom: 4 },
  macroTrack: { height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" as const },
  macroFill: { height: 8, borderRadius: 999, backgroundColor: ACCENT },
  macroLabel: { color: "#C7CFDD", fontSize: 12, marginTop: 8, opacity: 0.9 },

  mealCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  mealImgWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  },
  mealImg: { width: "100%" as const, height: "100%" as const },
  mealImgPlaceholder: { width: 36, height: 36, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.35)" },
  mealTitle: { color: "white", fontWeight: "900" as const, fontSize: 16 },
  mealSub: { color: MUTED, fontSize: 12, marginTop: 4, opacity: 0.9 },
  mealMoreBtn: { width: 42, height: 42, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const },

  sectionTitle: { fontSize: 18, color: ACCENT, fontWeight: "900" as const, marginTop: 14, marginBottom: 8 },

  logMoreCard: {
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logMoreIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: ACCENT, alignItems: "center" as const, justifyContent: "center" as const },
  logMoreTitle: { color: "white", fontWeight: "900" as const, fontSize: 16 },
  logMoreSub: { color: MUTED, marginTop: 4, fontSize: 12 },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start" as const,
    marginTop: 40,
  },
  modalBackdrop1: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end" as const,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: "#0B0F1A",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    maxHeight: "80%" as const,
    zIndex: 9999,
    elevation: 50,
  },
  modalHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 10 },
  modalTitle: { color: "white", fontWeight: "900" as const, fontSize: 16 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: "rgba(255,255,255,0.08)" },

  searchWrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: "white", fontSize: 13 },

  foodRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
  },
  foodName: { color: "white", fontWeight: "800" as const, fontSize: 14 },
  foodMeta: { color: MUTED, fontSize: 12, marginTop: 4 },
  foodAddBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: ACCENT, alignItems: "center" as const, justifyContent: "center" as const },

  clearMealBtn: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  clearMealText: { color: "white", fontWeight: "800" as const },

  detailRow: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  detailName: { color: "white", fontWeight: "800" as const, fontSize: 14 },
  detailMeta: { color: MUTED, fontSize: 12, marginTop: 4 },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: BORDER,
  },
};
