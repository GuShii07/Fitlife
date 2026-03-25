import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
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

type Gender = "male" | "female" | "na";

export default function TrainerSignup() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
    });
  }, [navigation]);

  // ✅ Auth
  const [email, setEmail] = useState("");

  // Trainer fields
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("na");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certYear, setCertYear] = useState("");

  // ✅ Real uploads (uri + filename)
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);

  const [certificateUri, setCertificateUri] = useState<string | null>(null);
  const [certificateName, setCertificateName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const isValid = useMemo(() => {
    const cleanEmail = email.trim().toLowerCase();
    const emailOk = /^\S+@\S+\.\S+$/.test(cleanEmail);

    const a = Number(age);
    const y = Number(certYear);
    const nameOk = fullName.trim().length >= 3;
    const ageOk = Number.isFinite(a) && a >= 18 && a <= 80;
    const certOk = certTitle.trim().length >= 2 && certIssuer.trim().length >= 2;
    const yearOk = certYear.trim() ? Number.isFinite(y) && y >= 1980 && y <= 2100 : true;

    const uploadsOk = !!photoUri && !!certificateUri;
    return emailOk && nameOk && ageOk && certOk && yearOk && uploadsOk;
  }, [email, fullName, age, certTitle, certIssuer, certYear, photoUri, certificateUri]);

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow photo access to upload a photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const name = asset.fileName ?? "trainer_photo.jpg";

      setPhotoUri(asset.uri);
      setPhotoName(name);
    } catch (e: any) {
      Alert.alert("Photo pick failed", e?.message || "Try again.");
    }
  };

  const pickCertificate = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;
      const file = res.assets?.[0];
      if (!file?.uri) return;

      setCertificateUri(file.uri);
      setCertificateName(file.name ?? "certificate.pdf");
    } catch (e: any) {
      Alert.alert("Certificate pick failed", e?.message || "Try again.");
    }
  };

  const submit = async () => {
    if (!isValid) {
      Alert.alert("Please complete the form", "Add valid details, photo + certificate.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // ✅ Send OTP for trainer
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      // ✅ Go to VerifyOtp with trainer payload
      router.push({
        pathname: "/auth/VerifyOtp",
        params: {
          mode: "signup",
          email: cleanEmail,

          // role flags
          role: "TRAINER",
          trainerApproved: "false",

          // trainer info
          fullName: fullName.trim(),
          gender,
          age,
          bio: bio.trim(),
          certTitle: certTitle.trim(),
          certIssuer: certIssuer.trim(),
          certYear: certYear.trim(),

          // upload uris (VerifyOtp will upload after OTP verification)
          photoUri: photoUri ?? "",
          photoName: photoName ?? "trainer_photo.jpg",
          certificateUri: certificateUri ?? "",
          certificateName: certificateName ?? "certificate.pdf",
        },
      });
    } catch (e: any) {
      Alert.alert("Something went wrong", e?.message || "Please try again.");
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={25} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} pointerEvents="none">
            Trainer Application
          </Text>

          <View style={styles.progressPill}>
            <Text style={{ color: "#D7DEEA", fontWeight: "800" }}>1/1</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.bigTitle}>Apply to become a trainer</Text>
        <Text style={styles.subTitle}>
          Fill in your details and upload your certification for verification.
        </Text>

        {/* Form */}
        <View style={{ marginTop: 24 }}>
          {/* ✅ Email */}
          <Text style={styles.label}>email</Text>
          <TextInput
            placeholder="e.g., trainer@email.com"
            placeholderTextColor="#6B7690"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>full name</Text>
          <TextInput
            placeholder="e.g., Alex Johnson"
            placeholderTextColor="#6B7690"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>gender</Text>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pill active={gender === "male"} text="Male" onPress={() => setGender("male")} />
              <Pill active={gender === "female"} text="Female" onPress={() => setGender("female")} />
              <Pill active={gender === "na"} text="Others" onPress={() => setGender("na")} full />
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>age</Text>
          <TextInput
            placeholder="e.g., 26"
            placeholderTextColor="#6B7690"
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
            style={styles.input}
            keyboardType="numeric"
          />
          <Text style={styles.helper}>Minimum age: 18</Text>

          <Text style={[styles.label, { marginTop: 16 }]}>profile photo</Text>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.9} style={styles.uploadBtn}>
            <Ionicons name="image-outline" size={20} color="#D7DEEA" />
            <Text style={styles.uploadText}>{photoName ? photoName : "Upload photo"}</Text>
            <Ionicons name="cloud-upload-outline" size={18} color="#9AA6BD" />
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 16 }]}>trainer certification</Text>
          <TextInput
            placeholder="Certification title (e.g., NASM CPT)"
            placeholderTextColor="#6B7690"
            value={certTitle}
            onChangeText={setCertTitle}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>certification issuer</Text>
          <TextInput
            placeholder="Issuer (e.g., NASM, ACE, ISSA)"
            placeholderTextColor="#6B7690"
            value={certIssuer}
            onChangeText={setCertIssuer}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>certification year (optional)</Text>
          <TextInput
            placeholder="e.g., 2024"
            placeholderTextColor="#6B7690"
            value={certYear}
            onChangeText={(t) => setCertYear(t.replace(/[^0-9]/g, ""))}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>upload certificate</Text>
          <TouchableOpacity onPress={pickCertificate} activeOpacity={0.9} style={styles.uploadBtn}>
            <Ionicons name="document-outline" size={20} color="#D7DEEA" />
            <Text style={styles.uploadText}>
              {certificateName ? certificateName : "Upload certificate (PDF/Image)"}
            </Text>
            <Ionicons name="cloud-upload-outline" size={18} color="#9AA6BD" />
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 16 }]}>short bio (optional)</Text>
          <TextInput
            placeholder="Tell users what you specialize in..."
            placeholderTextColor="#6B7690"
            value={bio}
            onChangeText={setBio}
            style={[styles.input, { height: 110, textAlignVertical: "top", paddingTop: 14 }]}
            multiline
          />
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={submit}
          disabled={!isValid || loading}
          activeOpacity={0.9}
          style={[
            styles.cta,
            { backgroundColor: !isValid || loading ? "#2A3550" : "#FF4D2D" },
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
              Send OTP →
            </Text>
          )}
        </TouchableOpacity>

        {!isValid && (
          <Text style={[styles.helper, { marginTop: 10, textAlign: "center" }]}>
            Enter email + upload photo & certificate to continue.
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
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
      <Text style={{ color: active ? "#FFD3CA" : "#D7DEEA", fontWeight: "900" }}>{text}</Text>
    </TouchableOpacity>
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
    marginTop: 6,
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
  uploadBtn: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#1D252E",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  uploadText: {
    color: "white",
    flex: 1,
    fontWeight: "800" as const,
  },
  pill: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1.5,
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
