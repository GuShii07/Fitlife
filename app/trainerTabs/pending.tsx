import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const MUTED = "#9AA6BD";
const CARD = "#111A2C";
const BORDER = "#1F2A44";

export default function TrainerPendingTab() {
  const [checking, setChecking] = useState(true);

  const checkApproval = useCallback(async () => {
    try {
      setChecking(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        router.replace("/auth/Login");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role, trainer_approved")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (profile?.role !== "TRAINER") {
        router.replace("/auth/Login");
        return;
      }

      if (profile?.trainer_approved) {
        router.replace("/trainerTabs/dashboard");
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkApproval();
    }, [checkApproval]),
  );

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/Login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG, padding: 20, justifyContent: "center" }}>
      <View
        style={{
          borderRadius: 20,
          backgroundColor: CARD,
          borderWidth: 1,
          borderColor: BORDER,
          padding: 18,
        }}
      >
        <Text style={{ color: ACCENT, fontSize: 28, fontWeight: "900" }}>Approval Pending</Text>
        <Text style={{ color: MUTED, marginTop: 12, fontSize: 15, lineHeight: 22 }}>
          Your trainer application was submitted. An admin will review your documents before granting trainer tab access.
        </Text>

        <TouchableOpacity
          onPress={checkApproval}
          activeOpacity={0.9}
          style={{
            marginTop: 18,
            height: 50,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: BORDER,
            backgroundColor: "#0F1627",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {checking ? (
            <ActivityIndicator color={ACCENT} />
          ) : (
            <Text style={{ color: "white", fontWeight: "900" }}>Check approval status</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={logout}
          activeOpacity={0.9}
          style={{
            marginTop: 12,
            height: 50,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ACCENT,
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
