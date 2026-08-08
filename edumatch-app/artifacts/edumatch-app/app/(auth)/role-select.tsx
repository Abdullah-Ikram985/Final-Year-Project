import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronLeft,
  GraduationCap,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Role = "candidate" | "recruiter";

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleContinue = () => {
    if (!role) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/(auth)/login", params: { role } });
  };

  return (
    <LinearGradient colors={["#1e1b4b", "#2e1a6e", "#4c1d95"]} style={styles.container}>
      <View style={[styles.circle1, { top: topInset + 60 }]} />
      <View style={styles.circle2} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 }]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="rgba(196,181,253,0.9)" />
        </TouchableOpacity>

        <View style={styles.heading}>
          <View style={styles.logoContainer}>
            <LinearGradient colors={["#7c3aed", "#a855f7"]} style={styles.logoGradient}>
              <UserPlus size={28} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Join EduMatch AI</Text>
          <Text style={styles.subtitle}>Choose how you'd like to use the platform</Text>
        </View>

        <View style={styles.options}>
          <RoleCard
            selected={role === "candidate"}
            onPress={() => { setRole("candidate"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            icon={<GraduationCap size={28} color="#fff" />}
            iconColors={["#7c3aed", "#a855f7"]}
            title="I'm a Candidate"
            tagline="Faculty looking for opportunities"
            features={[
              { Icon: Sparkles, text: "AI-matched job recommendations" },
              { Icon: TrendingUp, text: "Career roadmap & skill analysis" },
              { Icon: Briefcase, text: "Track applications & interviews" },
            ]}
          />

          <RoleCard
            selected={role === "recruiter"}
            onPress={() => { setRole("recruiter"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            icon={<Building2 size={28} color="#fff" />}
            iconColors={["#10b981", "#059669"]}
            title="I'm a Recruiter"
            tagline="Hiring for an institution"
            features={[
              { Icon: Search, text: "AI-powered candidate search" },
              { Icon: Users, text: "Ranked candidate matching" },
              { Icon: Briefcase, text: "Post jobs & manage hiring" },
            ]}
          />
        </View>

        <View style={{ height: 16 }} />

        <Pressable
          style={({ pressed }) => [styles.continueBtn, !role && styles.continueBtnDisabled, pressed && role && { opacity: 0.88 }]}
          onPress={handleContinue}
          disabled={!role}
        >
          <LinearGradient colors={role ? ["#7c3aed", "#6d28d9"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]} style={styles.continueGrad}>
            <Text style={[styles.continueText, !role && { color: "rgba(196,181,253,0.5)" }]}>Continue</Text>
            {role && <ArrowRight size={18} color="#fff" />}
          </LinearGradient>
        </Pressable>

        <Text style={styles.terms}>
          You can switch roles anytime from your profile settings
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

function RoleCard({ selected, onPress, icon, iconColors, title, tagline, features }: {
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  iconColors: [string, string];
  title: string;
  tagline: string;
  features: { Icon: any; text: string }[];
}) {
  return (
    <Pressable onPress={onPress} style={[styles.roleCard, selected && styles.roleCardActive]}>
      {selected && (
        <View style={styles.checkBadge}>
          <Check size={14} color="#fff" />
        </View>
      )}
      <View style={styles.roleTop}>
        <LinearGradient colors={iconColors} style={styles.roleIcon}>{icon}</LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleTagline}>{tagline}</Text>
        </View>
      </View>
      <View style={styles.featuresList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIconBg}>
              <f.Icon size={12} color="#a78bfa" />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: { position: "absolute", right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(124,58,237,0.18)" },
  circle2: { position: "absolute", bottom: 100, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(139,92,246,0.12)" },
  content: { paddingHorizontal: 24, gap: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  heading: { alignItems: "center", gap: 12, marginTop: 8 },
  logoContainer: { marginBottom: 4 },
  logoGradient: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "rgba(196,181,253,0.85)", textAlign: "center", fontFamily: "Inter_400Regular" },
  options: { gap: 14, marginTop: 8 },
  roleCard: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 18, position: "relative" },
  roleCardActive: { backgroundColor: "rgba(124,58,237,0.18)", borderColor: "#a855f7" },
  checkBadge: { position: "absolute", top: 14, right: 14, width: 24, height: 24, borderRadius: 12, backgroundColor: "#a855f7", alignItems: "center", justifyContent: "center" },
  roleTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  roleIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  roleTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 2 },
  roleTagline: { fontSize: 12, color: "rgba(196,181,253,0.8)", fontFamily: "Inter_400Regular" },
  featuresList: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIconBg: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(167,139,250,0.15)", alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 12, color: "rgba(196,181,253,0.9)", fontFamily: "Inter_500Medium", flex: 1 },
  continueBtn: { borderRadius: 16, overflow: "hidden" },
  continueBtnDisabled: {},
  continueGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17 },
  continueText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
  terms: { textAlign: "center", fontSize: 12, color: "rgba(196,181,253,0.6)", fontFamily: "Inter_400Regular" },
});
