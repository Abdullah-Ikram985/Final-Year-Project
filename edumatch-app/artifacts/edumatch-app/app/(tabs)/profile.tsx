import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Briefcase,
  ChevronRight,
  Code2,
  Eye,
  FileText,
  GraduationCap,
  LogOut,
  Pencil,
  School,
  Sparkles,
  TrendingUp,
  Upload,
  User,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const SKILLS = ["Python", "Machine Learning", "NLP", "TensorFlow", "Deep Learning", "Data Analysis", "Research Methods"];

export default function ProfileScreen() {
  const colors = useColors();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)"); } },
    ]);
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => router.push("/edit-profile")} style={styles.editBtn}>
            <Pencil size={15} color="rgba(196,181,253,0.9)" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.profileInitials ?? "AR"}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? "Dr. Aisha Raza"}</Text>
          <Text style={styles.userTitle}>{user?.title ?? "Assistant Professor"}</Text>
          <Text style={styles.userInstitution}>{user?.institution ?? "IISAT University"}</Text>
          <View style={styles.scoreRow}>
            <Sparkles size={14} color="#a855f7" />
            <Text style={styles.scoreText}>AI Match Score: {user?.matchScore ?? 87}%</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        {[
          { label: "Applications", value: "4" },
          { label: "Saved Jobs", value: "12" },
          { label: "Profile Views", value: "28" },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
            {i < 2 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: "#f0eeff" }]}>
            <Code2 size={16} color="#7c3aed" />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skills</Text>
        </View>
        <View style={styles.skillsWrap}>
          {SKILLS.map((s) => (
            <View key={s} style={styles.skillPill}><Text style={styles.skillText}>{s}</Text></View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: "#f0eeff" }]}>
            <GraduationCap size={16} color="#7c3aed" />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Education</Text>
        </View>
        {[
          { degree: "PhD Computer Science", uni: "MIT", year: "2019" },
          { degree: "MS Artificial Intelligence", uni: "LUMS", year: "2015" },
        ].map((e) => (
          <View key={e.degree} style={[styles.eduItem, { borderColor: colors.border }]}>
            <View style={[styles.eduIcon, { backgroundColor: "#f0eeff" }]}>
              <School size={18} color="#7c3aed" />
            </View>
            <View style={styles.eduMeta}>
              <Text style={[styles.eduDegree, { color: colors.foreground }]}>{e.degree}</Text>
              <Text style={[styles.eduUni, { color: colors.mutedForeground }]}>{e.uni} · {e.year}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        {[
          { label: "Career Roadmap", Icon: TrendingUp, route: "/career-roadmap", color: "#7c3aed", bg: "#f0eeff" },
          { label: "Resume Upload", Icon: Upload, route: "/resume-upload", color: "#3b82f6", bg: "#eff6ff" },
          { label: "Edit Profile", Icon: Pencil, route: "/edit-profile", color: "#10b981", bg: "#f0fdf4" },
        ].map((link) => (
          <TouchableOpacity key={link.label} style={[styles.linkItem, { borderBottomColor: colors.border }]} onPress={() => router.push(link.route as any)}>
            <View style={[styles.linkIcon, { backgroundColor: link.bg }]}>
              <link.Icon size={18} color={link.color} />
            </View>
            <Text style={[styles.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.card, borderColor: "#fecaca" }]} onPress={handleSignOut}>
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28, overflow: "hidden" },
  headerDecor: { position: "absolute", top: -20, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(124,58,237,0.15)" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#ffffff" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(196,181,253,0.9)" },
  avatarSection: { alignItems: "center" },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 3, borderColor: "rgba(255,255,255,0.2)" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#ffffff" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 4 },
  userTitle: { fontSize: 14, color: "rgba(196,181,253,0.9)", fontFamily: "Inter_500Medium", marginBottom: 2 },
  userInstitution: { fontSize: 13, color: "rgba(196,181,253,0.7)", fontFamily: "Inter_400Regular", marginBottom: 12 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(124,58,237,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  scoreText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#c4b5fd" },
  statsCard: { marginHorizontal: 16, marginTop: -20, borderRadius: 18, padding: 20, flexDirection: "row", justifyContent: "space-around", shadowColor: "#1e1b4b", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statDivider: { width: 1, height: "80%" },
  section: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillPill: { backgroundColor: "#ede9fe", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  skillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  eduItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  eduIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eduMeta: { flex: 1 },
  eduDegree: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  eduUni: { fontSize: 11, fontFamily: "Inter_400Regular" },
  linkItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: 1 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  linkLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 14, paddingVertical: 15, borderWidth: 1.5 },
  signOutText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ef4444" },
});
