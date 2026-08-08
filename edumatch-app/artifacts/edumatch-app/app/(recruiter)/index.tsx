import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react-native";
import React from "react";
import {
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

const RECENT_ACTIVITY = [
  { id: "1", type: "application", text: "5 new candidates applied to Assistant Professor – CS", time: "2h ago", Icon: UserCheck, color: "#7c3aed", bg: "#f0eeff" },
  { id: "2", type: "interview", text: "Interview scheduled with Dr. Aisha Raza", time: "4h ago", Icon: Calendar, color: "#10b981", bg: "#f0fdf4" },
  { id: "3", type: "view", text: "Your job posting got 24 new views today", time: "6h ago", Icon: Eye, color: "#3b82f6", bg: "#eff6ff" },
  { id: "4", type: "match", text: "3 high-match candidates found for your AI/ML role", time: "1d ago", Icon: Sparkles, color: "#f59e0b", bg: "#fffbeb" },
];

const TOP_CANDIDATES = [
  { id: "1", name: "Dr. Aisha Raza", role: "Assistant Professor", match: 96, initials: "AR", color: "#7c3aed", skills: ["Python", "ML", "NLP"] },
  { id: "2", name: "Dr. James Chen", role: "Senior Lecturer", match: 91, initials: "JC", color: "#3b82f6", skills: ["AI", "Research"] },
  { id: "3", name: "Dr. Maria Lopez", role: "Researcher", match: 88, initials: "ML", color: "#10b981", skills: ["Data Science"] },
];

export default function RecruiterDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSmall}>Welcome back,</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
            <View style={styles.orgRow}>
              <Building2 size={11} color="rgba(196,181,253,0.7)" />
              <Text style={styles.orgText}>{user?.organization ?? user?.institution}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Bell size={22} color="rgba(196,181,253,0.9)" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionLeft}>
            <View style={styles.actionIcon}>
              <Sparkles size={18} color="#a855f7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Find your next hire</Text>
              <Text style={styles.actionSub}>AI-matched candidates ready for review</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.actionCta} onPress={() => router.push("/post-job")}>
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.actionCtaGrad}>
              <Plus size={14} color="#fff" />
              <Text style={styles.actionCtaText}>Post Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          {[
            { label: "Active Jobs", value: "8", Icon: Briefcase, bg: "#f0eeff", iconColor: "#7c3aed" },
            { label: "Candidates", value: "142", Icon: Users, bg: "#eff6ff", iconColor: "#3b82f6" },
            { label: "Shortlisted", value: "23", Icon: CheckCircle, bg: "#f0fdf4", iconColor: "#10b981" },
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
              { label: "Post New Job", Icon: Plus, color: "#7c3aed", bg: "#f0eeff", route: "/post-job" },
              { label: "Find Candidates", Icon: Search, color: "#3b82f6", bg: "#eff6ff", route: "/(recruiter)/candidates" },
              { label: "View Shortlist", Icon: CheckCircle, color: "#10b981", bg: "#f0fdf4", route: "/(recruiter)/candidates" },
              { label: "Manage Jobs", Icon: Briefcase, color: "#f59e0b", bg: "#fffbeb", route: "/(recruiter)/jobs" },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={[styles.actionItem, { backgroundColor: colors.background }]} onPress={() => router.push(a.route as any)}>
                <View style={[styles.actionItemIcon, { backgroundColor: a.bg }]}>
                  <a.Icon size={20} color={a.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.recommendedSection}>
          <View style={styles.recommendedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top AI Matches</Text>
            <TouchableOpacity onPress={() => router.push("/(recruiter)/candidates")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardList}>
            {TOP_CANDIDATES.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.candCard, { backgroundColor: colors.card }]} onPress={() => router.push({ pathname: "/candidate-detail", params: { id: c.id } })}>
                <View style={styles.candTop}>
                  <View style={[styles.candAvatar, { backgroundColor: c.color + "20" }]}>
                    <Text style={[styles.candAvatarText, { color: c.color }]}>{c.initials}</Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Sparkles size={10} color="#10b981" />
                    <Text style={styles.matchBadgeText}>{c.match}%</Text>
                  </View>
                </View>
                <Text style={[styles.candName, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.candRole, { color: colors.mutedForeground }]}>{c.role}</Text>
                <View style={styles.candSkills}>
                  {c.skills.slice(0, 2).map((s) => (
                    <View key={s} style={styles.skillTag}><Text style={styles.skillTagText}>{s}</Text></View>
                  ))}
                </View>
                <TouchableOpacity style={[styles.viewBtn, { backgroundColor: colors.navy }]}>
                  <Text style={styles.viewBtnText}>View Profile</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.recommendedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Recent Activity</Text>
            <TrendingUp size={16} color="#7c3aed" />
          </View>
          <View style={{ marginTop: 12, gap: 12 }}>
            {RECENT_ACTIVITY.map((act) => (
              <View key={act.id} style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: act.bg }]}>
                  <act.Icon size={16} color={act.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityText, { color: colors.foreground }]}>{act.text}</Text>
                  <View style={styles.activityTimeRow}>
                    <Clock size={10} color={colors.mutedForeground} />
                    <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{act.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
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
  orgRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  orgText: { fontSize: 11, color: "rgba(196,181,253,0.7)", fontFamily: "Inter_500Medium" },
  notifBtn: { position: "relative", width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", borderWidth: 1.5, borderColor: "#2e1a6e" },
  actionCard: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  actionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(168,85,247,0.18)", alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" },
  actionSub: { fontSize: 11, color: "rgba(196,181,253,0.8)", fontFamily: "Inter_400Regular", marginTop: 2 },
  actionCta: { borderRadius: 10, overflow: "hidden", alignSelf: "flex-end" },
  actionCtaGrad: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8 },
  actionCtaText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#ffffff" },
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
  actionItemIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  recommendedSection: { marginBottom: 16 },
  recommendedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 13, color: "#7c3aed", fontFamily: "Inter_600SemiBold" },
  cardList: { paddingRight: 16, gap: 12 },
  candCard: { width: 200, borderRadius: 18, padding: 14, shadowColor: "#1e1b4b", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  candTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  candAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  candAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  matchBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f0fdf4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  matchBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#10b981" },
  candName: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  candRole: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 8 },
  candSkills: { flexDirection: "row", gap: 4, flexWrap: "wrap", marginBottom: 12 },
  skillTag: { backgroundColor: "#ede9fe", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  skillTagText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  viewBtn: { borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  viewBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#ffffff" },
  activityRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  activityIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activityText: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  activityTimeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  activityTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
});
