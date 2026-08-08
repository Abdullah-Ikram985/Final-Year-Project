import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Bell,
  Briefcase,
  Building2,
  CheckCircle,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  Mail,
  Pencil,
  Settings,
  Shield,
  Users,
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

export default function RecruiterProfileScreen() {
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
          <TouchableOpacity style={styles.editBtn}>
            <Pencil size={15} color="rgba(196,181,253,0.9)" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.profileInitials ?? "SM"}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? "Sarah Mitchell"}</Text>
          <Text style={styles.userTitle}>{user?.recruiterTitle ?? "HR Director"}</Text>
          <View style={styles.orgBadge}>
            <Building2 size={13} color="#a855f7" />
            <Text style={styles.orgText}>{user?.organization ?? "Stanford University"}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        {[
          { label: "Jobs Posted", value: "8" },
          { label: "Hires Made", value: "12" },
          { label: "Active Candidates", value: "142" },
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
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HIRING TOOLS</Text>
        {[
          { label: "My Job Postings", Icon: Briefcase, route: "/(recruiter)/jobs", color: "#7c3aed", bg: "#f0eeff" },
          { label: "All Candidates", Icon: Users, route: "/(recruiter)/candidates", color: "#3b82f6", bg: "#eff6ff" },
          { label: "Hiring Pipeline", Icon: CheckCircle, route: "/(recruiter)/candidates", color: "#10b981", bg: "#f0fdf4" },
        ].map((link, i, arr) => (
          <TouchableOpacity key={link.label} style={[styles.linkItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => router.push(link.route as any)}>
            <View style={[styles.linkIcon, { backgroundColor: link.bg }]}>
              <link.Icon size={18} color={link.color} />
            </View>
            <Text style={[styles.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        {[
          { label: "Organization Details", Icon: Building2, color: "#7c3aed", bg: "#f0eeff" },
          { label: "Notifications", Icon: Bell, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Email Templates", Icon: Mail, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Billing & Plan", Icon: CreditCard, color: "#10b981", bg: "#f0fdf4" },
          { label: "Privacy & Security", Icon: Shield, color: "#dc2626", bg: "#fef2f2" },
          { label: "Settings", Icon: Settings, color: "#6b7280", bg: "#f3f4f6" },
          { label: "Help & Support", Icon: HelpCircle, color: "#8b5cf6", bg: "#f5f3ff" },
        ].map((link, i, arr) => (
          <TouchableOpacity key={link.label} style={[styles.linkItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
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
  userTitle: { fontSize: 14, color: "rgba(196,181,253,0.9)", fontFamily: "Inter_500Medium", marginBottom: 12 },
  orgBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(124,58,237,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  orgText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#c4b5fd" },
  statsCard: { marginHorizontal: 16, marginTop: -20, borderRadius: 18, padding: 20, flexDirection: "row", justifyContent: "space-around", shadowColor: "#1e1b4b", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  statDivider: { width: 1, height: "80%" },
  section: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.6, marginBottom: 8 },
  linkItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  linkLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 14, paddingVertical: 15, borderWidth: 1.5 },
  signOutText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ef4444" },
});
