import * as FileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
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
type Role = "USER" | "TRAINER"| "ADMIN";
type OtpMode = "signup" | "login";

async function uriToArrayBuffer(uri: string) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function extFromName(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function contentTypeFromName(name: string, fallback: string) {
  const ext = extFromName(name);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  return fallback;
}

async function uploadToSupabase(params: {
  bucket: string;
  path: string;
  uri: string;
  contentType: string;
}) {
  const arrayBuffer = await uriToArrayBuffer(params.uri);
  const { error } = await supabase.storage.from(params.bucket).upload(params.path, arrayBuffer, {
    contentType: params.contentType,
    upsert: true,
  });
  if (error) throw error;
  return params.path;
}

function toHeightCm(height?: string, heightUnit?: HeightUnit) {
  const n = Number(String(height ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;

  if (heightUnit === "ft") {
    return n * 30.48;
  }

  return n;
}

function toWeightKg(weight?: string, unit?: Unit) {
  const n = Number(String(weight ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;

  if (unit === "lb") {
    return n * 0.45359237;
  }

  return n;
}

function getActivityMultiplier(activityLevel?: ActivityLevel) {
  switch (activityLevel) {
    case "sedentary":
      return 1.2;
    case "lightly_active":
      return 1.375;
    case "moderately_active":
      return 1.55;
    case "very_active":
      return 1.725;
    case "extra_active":
      return 1.9;
    default:
      return 1.375;
  }
}

function calculateCalorieGoal(params: {
  gender?: Gender;
  age?: string;
  height?: string;
  heightUnit?: HeightUnit;
  currentWeight?: string;
  unit?: Unit;
  activityLevel?: ActivityLevel;
  goalType?: GoalType;
}) {
  const ageNum = Number(params.age ?? "");
  const weightKg = toWeightKg(params.currentWeight, params.unit);
  const heightCm = toHeightCm(params.height, params.heightUnit);

  if (!weightKg || !heightCm || !Number.isFinite(ageNum) || ageNum <= 0) {
    return 2000;
  }

  // Mifflin-St Jeor
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum;

  if (params.gender === "male") bmr += 5;
  else if (params.gender === "female") bmr -= 161;
  else bmr -= 78; // neutral midpoint for others / prefer not to say

  const activityMultiplier = getActivityMultiplier(params.activityLevel);
  let maintenance = bmr * activityMultiplier;

  switch (params.goalType) {
    case "lose_weight":
      maintenance -= 400;
      break;
    case "gain_muscle":
      maintenance += 250;
      break;
    case "endurance":
      maintenance += 350;
      break;
    case "stay_fit":
    default:
      break;
  }

  const finalCalories = Math.round(maintenance);

  return Math.max(1200, Math.min(finalCalories, 5000));
}

export default function VerifyOtp() {
  const params = useLocalSearchParams<{
    mode?: OtpMode;
    email?: string;

    // USER profile fields
    firstName?: string;
    gender?: Gender;
    age?: string;
    height?: string;
    heightUnit?: HeightUnit;
    unit?: Unit;
    currentWeight?: string;
    goalWeight?: string;
    activityLevel?: ActivityLevel;
    goalType?: GoalType;

    // role
    role?: Role;

    // TRAINER application fields
    fullName?: string;
    bio?: string;
    certTitle?: string;
    certIssuer?: string;
    certYear?: string;

    // upload info
    photoUri?: string;
    photoName?: string;
    certificateUri?: string;
    certificateName?: string;
  }>();

  const safeEmail = useMemo(() => String(params.email || "").trim().toLowerCase(), [params.email]);
  const mode: OtpMode = params.mode === "login" ? "login" : "signup";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit code from your email.");
      return;
    }

    if (!safeEmail) {
      Alert.alert("Missing email", "Go back and enter your email again.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: safeEmail,
        token: cleanCode,
        type: "email",
      });
      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) throw new Error("No session returned");

      if (mode === "login") {
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, trainer_approved")
          .eq("id", userId)
          .maybeSingle();

        if (profileErr) throw profileErr;

        if (!profile) {
          throw new Error("Profile not found. Please sign up first.");
        }

        if (profile.role === "TRAINER" && !profile.trainer_approved) {
          router.replace("/trainerTabs/pending");
          return;
        }

        if (profile.role === "TRAINER") {
          router.replace("/trainerTabs/dashboard");
          return;
        }

        if (profile.role === "ADMIN") {
          router.replace("/admin/admin");
          return;
        }

        router.replace("/userTabs/diet");
        return;
      }

      const role: Role = params.role === "TRAINER" ? "TRAINER" : "USER";

      const toNum = (v?: string) => {
        const n = Number(String(v ?? "").replace(",", "."));
        return Number.isFinite(n) ? n : null;
      };

      const calorieGoal =
        role === "USER"
          ? calculateCalorieGoal({
            gender: params.gender,
            age: params.age,
            height: params.height,
            heightUnit: params.heightUnit,
            currentWeight: params.currentWeight,
            unit: params.unit,
            activityLevel: params.activityLevel,
            goalType: params.goalType,
          })
          : null;

      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: safeEmail,

            first_name: params.firstName ? String(params.firstName).trim() : null,
            gender: (params.gender as any) ?? null,
            age: params.age ? Number(params.age) : null,

            height: toNum(params.height),
            height_unit: (params.heightUnit as any) ?? null,

            unit: (params.unit as any) ?? null,
            current_weight: toNum(params.currentWeight),
            goal_weight: toNum(params.goalWeight),

            activity_level: (params.activityLevel as any) ?? null,
            goal_type: (params.goalType as any) ?? null,

            calorie_goal: calorieGoal,

            role,
            trainer_approved: role === "TRAINER" ? false : true,
          },
          { onConflict: "id" }
        );

      if (profileErr) throw profileErr;

      if (role === "TRAINER") {
        const fullName = String(params.fullName ?? "").trim();
        const certTitle = String(params.certTitle ?? "").trim();
        const certIssuer = String(params.certIssuer ?? "").trim();

        if (!fullName || fullName.length < 3) throw new Error("Missing full name.");
        if (!certTitle || certTitle.length < 2) throw new Error("Missing certification title.");
        if (!certIssuer || certIssuer.length < 2) throw new Error("Missing certification issuer.");

        const photoUri = String(params.photoUri ?? "");
        const photoName = String(params.photoName ?? "trainer_photo.jpg");
        const certUri = String(params.certificateUri ?? "");
        const certName = String(params.certificateName ?? "certificate.pdf");

        if (!photoUri) throw new Error("Missing photo to upload.");
        if (!certUri) throw new Error("Missing certificate to upload.");

        const photoPath = `${userId}/photo.${extFromName(photoName) || "jpg"}`;
        const certificatePath = `${userId}/certificate.${extFromName(certName) || "pdf"}`;

        const uploadedPhotoPath = await uploadToSupabase({
          bucket: "trainer_uploads",
          path: photoPath,
          uri: photoUri,
          contentType: contentTypeFromName(photoName, "image/jpeg"),
        });

        const uploadedCertPath = await uploadToSupabase({
          bucket: "trainer_uploads",
          path: certificatePath,
          uri: certUri,
          contentType: contentTypeFromName(certName, "application/pdf"),
        });

        const { error: appErr } = await supabase.from("trainer_applications").insert({
          user_id: userId,
          full_name: fullName,
          gender: (params.gender as any) ?? null,
          age: params.age ? Number(params.age) : null,
          bio: params.bio ? String(params.bio).trim() : null,
          cert_title: certTitle,
          cert_issuer: certIssuer,
          cert_year: params.certYear ? Number(params.certYear) : null,
          photo_path: uploadedPhotoPath,
          certificate_path: uploadedCertPath,
          status: "PENDING",
        });

        if (appErr) throw appErr;

        router.replace("/trainerTabs/pending");
        return;
      }

      router.replace({
        pathname: "/auth/reset-password",
        params: {
          fromSignup: "1",
          next: "/userTabs/diet",
        },
      });
    } catch (e: any) {
      Alert.alert("Verification failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!safeEmail) {
      Alert.alert("Missing email", "Go back and enter your email again.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: safeEmail,
        options: { shouldCreateUser: mode === "signup" },
      });

      if (error) throw error;
      Alert.alert("Code sent", "We sent a new 6-digit code.");
    } catch (e: any) {
      Alert.alert("Resend failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: "#0B0F1A",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Enter code</Text>

      <Text style={{ color: "#9AA6BD", marginTop: 6 }}>
        We sent a 6-digit code to{" "}
        <Text style={{ color: "white", fontWeight: "800" }}>{safeEmail}</Text>
      </Text>

      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        placeholderTextColor="#6B7690"
        keyboardType="numeric"
        style={{
          marginTop: 18,
          height: 54,
          borderRadius: 14,
          paddingHorizontal: 14,
          color: "white",
          letterSpacing: 6,
          fontWeight: "900",
          borderWidth: 1.5,
          borderColor: "#FF4D2D",
        }}
      />

      <Pressable
        onPress={verify}
        disabled={loading}
        style={{
          marginTop: 16,
          height: 56,
          borderRadius: 16,
          backgroundColor: loading ? "#2A3550" : "#FF4D2D",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </Text>
      </Pressable>

      <Pressable onPress={resend} disabled={loading} style={{ marginTop: 14, alignItems: "center" }}>
        <Text style={{ color: "#9AA6BD" }}>
          Didn’t receive a code?{" "}
          <Text style={{ color: "#FF4D2D", fontWeight: "900" }}>Resend</Text>
        </Text>
      </Pressable>
    </View>
  );
} 
