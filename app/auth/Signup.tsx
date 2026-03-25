import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

type Gender = "male" | "female" | "na" | "others";
type GoalType = "lose_weight" | "gain_muscle" | "stay_fit" | "endurance";
type Unit = "kg" | "lb";
type HeightUnit = "cm" | "ft";
type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export default function Signup() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  const [step, setStep] = useState(1);
  const totalSteps = 9;

  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("");

  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [height, setHeight] = useState("");

  const [unit, setUnit] = useState<Unit>("kg");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");

  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("moderately_active");
  const [goalType, setGoalType] = useState<GoalType>("lose_weight");

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (step === 1) return;
      e.preventDefault();
      setStep((s) => Math.max(1, s - 1));
    });

    return unsub;
  }, [navigation, step]);

  const goBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const title = useMemo(() => {
    switch (step) {
      case 1:
        return "What would you like us to call you?";
      case 2:
        return "What’s your gender?";
      case 3:
        return "How old are you?";
      case 4:
        return "What’s your height?";
      case 5:
        return "What’s your current weight?";
      case 6:
        return "What’s your goal weight?";
      case 7:
        return "How active are you?";
      case 8:
        return "What’s your primary fitness goal?";
      case 9:
        return "Create your account";
      default:
        return "";
    }
  }, [step]);

  const subtitle = useMemo(() => {
    switch (step) {
      case 1:
        return "We’ll use this to personalize your experience.";
      case 2:
        return "This helps us personalize training and calorie targets.";
      case 3:
        return "Age helps us recommend safe and effective plans.";
      case 4:
        return "Height helps us estimate your calorie target more accurately.";
      case 5:
        return "We’ll track your progress starting from here.";
      case 6:
        return "This helps us set realistic milestones.";
      case 7:
        return "Activity level helps us calculate your daily calorie needs.";
      case 8:
        return "We’ll tailor workouts and nutrition to match your goal.";
      case 9:
        return "Add your email to receive a one-time verification code.";
      default:
        return "";
    }
  }, [step]);

  const stepValid = useMemo(() => {
    const toNum = (v: string) => Number(v.replace(",", "."));

    if (step === 1) return firstName.trim().length >= 2;

    if (step === 2)
      return (
        gender === "male" ||
        gender === "female" ||
        gender === "others" ||
        gender === "na"
      );

    if (step === 3) {
      const n = Number(age);
      return Number.isFinite(n) && n >= 10 && n <= 90;
    }

    if (step === 4) {
      const n = toNum(height);
      if (!Number.isFinite(n)) return false;
      return heightUnit === "cm" ? n >= 100 && n <= 250 : n >= 3 && n <= 8;
    }

    if (step === 5) {
      const n = toNum(currentWeight);
      return Number.isFinite(n) && n > 20 && n < 400;
    }

    if (step === 6) {
      const n = toNum(goalWeight);
      return Number.isFinite(n) && n > 20 && n < 400;
    }

    if (step === 7) return !!activityLevel;

    if (step === 8) return !!goalType;

    if (step === 9) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    return false;
  }, [
    step,
    firstName,
    gender,
    age,
    height,
    heightUnit,
    currentWeight,
    goalWeight,
    activityLevel,
    goalType,
    email,
  ]);

  const goNext = () => {
    if (!stepValid) {
      Alert.alert("Please fill this step", "Enter valid details to continue.");
      return;
    }
    if (step < totalSteps) setStep((s) => s + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    if (!stepValid || loading) return;

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      router.push({
        pathname: "/auth/VerifyOtp",
        params: {
          mode: "signup",
          role: "USER",
          email: cleanEmail,
          firstName: firstName.trim(),
          gender,
          age,
          height,
          heightUnit,
          unit,
          currentWeight,
          goalWeight,
          activityLevel,
          goalType,
        },
      });
    } catch (e: any) {
      Alert.alert("Signup failed", e?.message ?? "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B0F1A" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            activeOpacity={0.85}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back-outline" size={25} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} pointerEvents="none">
            Welcome to FitLife
          </Text>

          <View style={styles.progressPill}>
            <Text style={{ color: "#D7DEEA", fontWeight: "800" }}>
              {step}/{totalSteps}
            </Text>
          </View>
        </View>

        <Text style={styles.bigTitle}>{title}</Text>
        <Text style={styles.subTitle}>{subtitle}</Text>

        <View style={{ marginTop: 24 }}>
          {step === 1 && (
            <>
              <Text style={styles.label}>preferred first name</Text>
              <TextInput
                placeholder="e.g., Prajwal"
                placeholderTextColor="#6B7690"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                autoCapitalize="words"
              />
            </>
          )}

          {step === 2 && (
            <View style={{ gap: 12 }}>
              <PillRow>
                <Pill
                  active={gender === "male"}
                  text="Male"
                  onPress={() => setGender("male")}
                />
                <Pill
                  active={gender === "female"}
                  text="Female"
                  onPress={() => setGender("female")}
                />
                <Pill
                  active={gender === "others"}
                  text="Others"
                  onPress={() => setGender("others")}
                />
              </PillRow>
              <Pill
                active={gender === "na"}
                text="Prefer not to say"
                onPress={() => setGender("na")}
                full
              />
            </View>
          )}

          {step === 3 && (
            <>
              <Text style={styles.label}>please enter your age</Text>
              <TextInput
                placeholder="e.g., 21"
                placeholderTextColor="#6B7690"
                value={age}
                onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
              />
              <Text style={styles.helper}>Allowed range: 10–90</Text>
            </>
          )}

          {step === 4 && (
            <>
              <RowBetween>
                <Text style={styles.label}>height</Text>
                <HeightUnitToggle
                  heightUnit={heightUnit}
                  setHeightUnit={setHeightUnit}
                />
              </RowBetween>
              <TextInput
                placeholder={heightUnit === "cm" ? "e.g., 175" : "e.g., 5.8"}
                placeholderTextColor="#6B7690"
                value={height}
                onChangeText={(t) => setHeight(t.replace(/[^0-9.,]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
              />
              <Text style={styles.helper}>
                {heightUnit === "cm"
                  ? "Allowed range: 100–250 cm"
                  : "Allowed range: 3–8 ft"}
              </Text>
            </>
          )}

          {step === 5 && (
            <>
              <RowBetween>
                <Text style={styles.label}>current weight</Text>
                <UnitToggle unit={unit} setUnit={setUnit} />
              </RowBetween>
              <TextInput
                placeholder={unit === "kg" ? "e.g., 72" : "e.g., 160"}
                placeholderTextColor="#6B7690"
                value={currentWeight}
                onChangeText={(t) =>
                  setCurrentWeight(t.replace(/[^0-9.,]/g, ""))
                }
                style={styles.input}
                keyboardType="numeric"
              />
            </>
          )}

          {step === 6 && (
            <>
              <RowBetween>
                <Text style={styles.label}>goal weight</Text>
                <UnitToggle unit={unit} setUnit={setUnit} />
              </RowBetween>
              <TextInput
                placeholder={unit === "kg" ? "e.g., 65" : "e.g., 145"}
                placeholderTextColor="#6B7690"
                value={goalWeight}
                onChangeText={(t) => setGoalWeight(t.replace(/[^0-9.,]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
              />
            </>
          )}

          {step === 7 && (
            <View style={{ gap: 12 }}>
              <Pill
                active={activityLevel === "sedentary"}
                text="Sedentary"
                onPress={() => setActivityLevel("sedentary")}
                full
              />
              <Pill
                active={activityLevel === "lightly_active"}
                text="Lightly active"
                onPress={() => setActivityLevel("lightly_active")}
                full
              />
              <Pill
                active={activityLevel === "moderately_active"}
                text="Moderately active"
                onPress={() => setActivityLevel("moderately_active")}
                full
              />
              <Pill
                active={activityLevel === "very_active"}
                text="Very active"
                onPress={() => setActivityLevel("very_active")}
                full
              />
              <Pill
                active={activityLevel === "extra_active"}
                text="Extra active"
                onPress={() => setActivityLevel("extra_active")}
                full
              />
            </View>
          )}

          {step === 8 && (
            <View style={{ gap: 12 }}>
              <Pill
                active={goalType === "lose_weight"}
                text="Lose weight"
                onPress={() => setGoalType("lose_weight")}
                full
              />
              <Pill
                active={goalType === "gain_muscle"}
                text="Gain muscle"
                onPress={() => setGoalType("gain_muscle")}
                full
              />
              <Pill
                active={goalType === "stay_fit"}
                text="Stay fit"
                onPress={() => setGoalType("stay_fit")}
                full
              />
              <Pill
                active={goalType === "endurance"}
                text="Improve endurance"
                onPress={() => setGoalType("endurance")}
                full
              />
            </View>
          )}

          {step === 9 && (
            <>
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
              <Text style={styles.helper}>
                We will send a 6-digit OTP to verify your email.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={goNext}
          disabled={!stepValid || loading}
          activeOpacity={0.9}
          style={[
            styles.cta,
            { backgroundColor: !stepValid || loading ? "#2A3550" : "#FF4D2D" },
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
              {step === totalSteps ? "Finish →" : "Continue →"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function RowBetween({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {children}
    </View>
  );
}

function PillRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 12 }}>{children}</View>;
}

function Pill({
  active,
  text,
  onPress,
  full,
}: {
  active: boolean;
  text: string;
  onPress: () => void;
  full?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.pill,
        {
          flex: full ? undefined : 1,
          borderColor: active ? "#FF4D2D" : "#24314E",
          backgroundColor: active ? "rgba(255,77,45,0.12)" : "transparent",
        },
      ]}
    >
      <Text
        style={{ color: active ? "#FFD3CA" : "#D7DEEA", fontWeight: "900" }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function UnitToggle({
  unit,
  setUnit,
}: {
  unit: Unit;
  setUnit: (u: Unit) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <TouchableOpacity
        onPress={() => setUnit("kg")}
        activeOpacity={0.9}
        style={[
          styles.unitBtn,
          { backgroundColor: unit === "kg" ? "#FF4D2D" : "transparent" },
        ]}
      >
        <Text
          style={{
            color: unit === "kg" ? "white" : "#9AA6BD",
            fontWeight: "900",
          }}
        >
          kg
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setUnit("lb")}
        activeOpacity={0.9}
        style={[
          styles.unitBtn,
          { backgroundColor: unit === "lb" ? "#FF4D2D" : "transparent" },
        ]}
      >
        <Text
          style={{
            color: unit === "lb" ? "white" : "#9AA6BD",
            fontWeight: "900",
          }}
        >
          lb
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function HeightUnitToggle({
  heightUnit,
  setHeightUnit,
}: {
  heightUnit: HeightUnit;
  setHeightUnit: (u: HeightUnit) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <TouchableOpacity
        onPress={() => setHeightUnit("cm")}
        activeOpacity={0.9}
        style={[
          styles.unitBtn,
          { backgroundColor: heightUnit === "cm" ? "#FF4D2D" : "transparent" },
        ]}
      >
        <Text
          style={{
            color: heightUnit === "cm" ? "white" : "#9AA6BD",
            fontWeight: "900",
          }}
        >
          cm
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setHeightUnit("ft")}
        activeOpacity={0.9}
        style={[
          styles.unitBtn,
          { backgroundColor: heightUnit === "ft" ? "#FF4D2D" : "transparent" },
        ]}
      >
        <Text
          style={{
            color: heightUnit === "ft" ? "white" : "#9AA6BD",
            fontWeight: "900",
          }}
        >
          ft
        </Text>
      </TouchableOpacity>
    </View>
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
  progressPill: {
    minWidth: 56,
    height: 32,
    paddingHorizontal: 12,
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
  helper: {
    color: "#6B7690",
    marginTop: 8,
    fontSize: 12,
  },
  label: {
    color: "#6B7690",
    fontWeight: "800" as const,
    textTransform: "lowercase" as const,
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
  pill: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1.5,
  },
  unitBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#24314E",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  cta: {
    height: 58,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: "#0B0F1A",
    borderTopWidth: 1,
    borderTopColor: "#1F2A44",
  },
};
