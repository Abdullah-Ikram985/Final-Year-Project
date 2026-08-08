import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Bell,
  Bookmark,
  Briefcase,
  Eye,
  FileText,
  Home,
  MapPin,
  Pencil,
  Sparkles,
  TrendingUp,
  Upload,
  User,
} from "lucide-react-native";
import React from "react";
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
import Svg, { Circle } from "react-native-svg";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const RECOMMENDED_JOBS = [
  { id: "1", uni: "Stanford University", role: "Assistant Professor", dept: "Computer Science", loc: "Stanford, CA", match: 94, initials: "SU", color: "#dc2626" },
  { id: "2", uni: "MIT", role: "Associate Professor", dept: "AI & Machine Learning", loc: "Cambridge, MA", match: 89, initials: "MI", color: "#7c3aed" },
  { id: "3", uni: "Carnegie Mellon", role: "Lecturer", dept: "Data Science", loc: "Pittsburgh, PA", match: 81, initials: "CM", color: "#0369a1" },
];

export default function HomeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const firstName = user?.name?.split(" ").slice(-2).join(" ") ?? "there";
  const matchScore = user?.matchScore ?? 87;
  const circumference = 2 * Math.PI * 22;
  const dashoffset = circumference - (matchScore / 100) * circumference;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSmall}>Good morning,</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Bell size={22} color="rgba(196,181,253,0.9)" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.matchCard}>
          <View style={styles.matchLeft}>
            <View style={styles.circleWrap}>
              <Svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: [{ rotate: "-90deg" }] }}>
                <Circle cx="26" cy="26" r="22" fill="none" stroke="#e5e0f8" strokeWidth="4" />
                <Circle cx="26" cy="26" r="22" fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashoffset} />
              </Svg>
              <View style={styles.circleInner}>
                <Text style={styles.circleScore}>{matchScore}</Text>
                <Text style={styles.circlePercent}>%</Text>
              </View>
            </View>
          </View>
          <View style={styles.matchRight}>
            <View style={styles.matchTitleRow}>
              <Sparkles size={13} color="#a855f7" />
              <Text style={styles.matchTitle}>Profile Match Score</Text>
            </View>
            <Text style={styles.matchSub}>Upload your latest resume to increase score to 94%</Text>
            <TouchableOpacity style={styles.matchCta} onPress={() => router.push("/resume-upload")}>
              <Text style={styles.matchCtaText}>Upload Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          {[
            { label: "Applications", value: "4", Icon: FileText, bg: "#eff6ff", iconColor: "#3b82f6" },
            { label: "Saved Jobs", value: "12", Icon: Bookmark, bg: "#f0fdf4", iconColor: "#10b981" },
            { label: "Profile Views", value: "28", Icon: Eye, bg: "#fdf4ff", iconColor: "#a855f7" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <s.Icon size={18} color={s.iconColor} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {[
              { label: "Career Roadmap", Icon: TrendingUp, color: "#7c3aed", bg: "#f0eeff", route: "/career-roadmap" },
              { label: "Upload Resume", Icon: Upload, color: "#3b82f6", bg: "#eff6ff", route: "/resume-upload" },
              { label: "Edit Profile", Icon: Pencil, color: "#10b981", bg: "#f0fdf4", route: "/edit-profile" },
              { label: "Browse Jobs", Icon: Briefcase, color: "#f59e0b", bg: "#fffbeb", route: "/(tabs)/jobs" },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={[styles.actionItem, { backgroundColor: colors.background }]} onPress={() => router.push(a.route as any)}>
                <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                  <a.Icon size={20} color={a.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.recommendedSection}>
          <View style={styles.recommendedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recommended for You</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobCards}>
            {RECOMMENDED_JOBS.map((job) => (
              <View key={job.id} style={[styles.jobCard, { backgroundColor: colors.card }]}>
                <View style={styles.jobTop}>
                  <View style={[styles.jobAvatar, { backgroundColor: job.color + "18" }]}>
                    <Text style={[styles.jobAvatarText, { color: job.color }]}>{job.initials}</Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Sparkles size={10} color="#10b981" />
                    <Text style={styles.matchBadgeText}>{job.match}%</Text>
                  </View>
                </View>
                <Text style={[styles.jobRole, { color: colors.foreground }]}>{job.role}</Text>
                <Text style={[styles.jobUni, { color: colors.mutedForeground }]}>{job.uni}</Text>
                <Text style={[styles.jobDept, { color: colors.mutedForeground }]}>{job.dept}</Text>
                <View style={styles.jobLocRow}>
                  <MapPin size={11} color={colors.mutedForeground} />
                  <Text style={[styles.jobLoc, { color: colors.mutedForeground }]}>{job.loc}</Text>
                </View>
                <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.navy }]}>
                  <Text style={styles.applyBtnText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  headerDecor: { position: "absolute", top: -30, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(124,58,237,0.15)" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greetingSmall: { fontSize: 13, color: "rgba(196,181,253,0.8)", fontFamily: "Inter_400Regular" },
  greetingName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#ffffff", marginTop: 2 },
  notifBtn: { position: "relative", width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", borderWidth: 1.5, borderColor: "#2e1a6e" },
  matchCard: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", gap: 14 },
  matchLeft: { alignItems: "center", justifyContent: "center" },
  circleWrap: { position: "relative", width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  circleInner: { position: "absolute", flexDirection: "row", alignItems: "flex-end" },
  circleScore: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#ffffff" },
  circlePercent: { fontSize: 9, color: "#a855f7", fontFamily: "Inter_600SemiBold", marginBottom: 1 },
  matchRight: { flex: 1 },
  matchTitleRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  matchTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#ffffff" },
  matchSub: { fontSize: 11, color: "rgba(196,181,253,0.8)", fontFamily: "Inter_400Regular", lineHeight: 16, marginBottom: 8 },
  matchCta: { flexDirection: "row", alignItems: "center", gap: 3 },
  matchCtaText: { fontSize: 12, color: "#a855f7", fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  section: { borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 14 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionItem: { width: "47%", borderRadius: 14, padding: 14, alignItems: "center", gap: 10 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  recommendedSection: { marginBottom: 16 },
  recommendedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 13, color: "#7c3aed", fontFamily: "Inter_600SemiBold" },
  jobCards: { paddingRight: 16, gap: 12 },
  jobCard: { width: 220, borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  jobTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  jobAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  jobAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  matchBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f0fdf4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  matchBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#10b981" },
  jobRole: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 3 },
  jobUni: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
  jobDept: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 6 },
  jobLocRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 12 },
  jobLoc: { fontSize: 10, fontFamily: "Inter_400Regular" },
  applyBtn: { borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  applyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#ffffff" },
});
