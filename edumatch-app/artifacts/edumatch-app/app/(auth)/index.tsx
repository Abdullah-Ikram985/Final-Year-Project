import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowRight, GraduationCap, Sparkles, FileText, TrendingUp } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(auth)/role-select");
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient colors={["#1e1b4b", "#2e1a6e", "#4c1d95"]} style={styles.container}>
      <View style={[styles.circle1, { top: topInset + 60 }]} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <View style={[styles.content, { paddingTop: topInset + 80, paddingBottom: bottomInset + 40 }]}>
        <Animated.View style={[styles.logoArea, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoContainer}>
            <LinearGradient colors={["#7c3aed", "#a855f7"]} style={styles.logoGradient}>
              <GraduationCap size={36} color="#fff" />
            </LinearGradient>
            <View style={styles.logoSparks}>
              <View style={[styles.spark, { top: -4, right: -4, backgroundColor: "#a855f7" }]} />
              <View style={[styles.spark, { bottom: 0, left: -6, backgroundColor: "#c084fc", width: 6, height: 6 }]} />
            </View>
          </View>
          <Text style={styles.logoText}>EduMatch AI</Text>
          <Text style={styles.tagline}>Find Your Academic Future{"\n"}with the Power of AI</Text>
        </Animated.View>

        <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
          {[
            { icon: <Sparkles size={14} color="#a78bfa" />, label: "AI-Powered Matching" },
            { icon: <FileText size={14} color="#a78bfa" />, label: "Smart Resume Analysis" },
            { icon: <TrendingUp size={14} color="#a78bfa" />, label: "Career Roadmap" },
          ].map((f) => (
            <View key={f.label} style={styles.featurePill}>
              {f.icon}
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View style={[styles.buttons, { opacity: buttonOpacity, transform: [{ translateY: slideAnim }] }]}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
            onPress={handleGetStarted}
          >
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.primaryBtnGradient}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <ArrowRight size={18} color="#fff" />
            </LinearGradient>
          </Pressable>

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: { position: "absolute", right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(124, 58, 237, 0.18)" },
  circle2: { position: "absolute", bottom: 200, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(139, 92, 246, 0.12)" },
  circle3: { position: "absolute", bottom: -40, right: 60, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(167, 139, 250, 0.08)" },
  content: { flex: 1, paddingHorizontal: 28, alignItems: "center" },
  logoArea: { alignItems: "center", width: "100%" },
  logoContainer: { position: "relative", marginBottom: 24 },
  logoGradient: { width: 88, height: 88, borderRadius: 26, alignItems: "center", justifyContent: "center", shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 16 },
  logoSparks: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  spark: { position: "absolute", width: 8, height: 8, borderRadius: 4 },
  logoText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.5, marginBottom: 12 },
  tagline: { fontSize: 16, color: "rgba(196, 181, 253, 0.9)", textAlign: "center", lineHeight: 24, fontFamily: "Inter_400Regular" },
  features: { marginTop: 36, gap: 10, width: "100%", alignItems: "flex-start" },
  featurePill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(124, 58, 237, 0.15)", borderWidth: 1, borderColor: "rgba(167, 139, 250, 0.2)", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 40 },
  featureText: { fontSize: 13, color: "#c4b5fd", fontFamily: "Inter_500Medium" },
  buttons: { width: "100%", gap: 14 },
  primaryBtn: { borderRadius: 16, overflow: "hidden" },
  primaryBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18, borderRadius: 16 },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
  secondaryBtn: { alignItems: "center", paddingVertical: 8 },
  secondaryBtnText: { fontSize: 14, color: "rgba(196, 181, 253, 0.8)", fontFamily: "Inter_400Regular" },
});
