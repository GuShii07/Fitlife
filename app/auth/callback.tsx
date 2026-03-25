import { router } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    const run = async () => {
      // Supabase will complete session automatically if it can
      await supabase.auth.getSession();

      // After verify, send them to login (or home if you want)
      router.replace("/auth/Login");
    };

    run();
  }, []);

  // return (
  //   // <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
  //   //   <Text style={{ color: "white" }}>Verifying...</Text>
  //   // </View>
  // );
}
