import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1e1b4b" }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  if (user.role === "recruiter") {
    return <Redirect href="/(recruiter)" />;
  }

  return <Redirect href="/(tabs)" />;
}
