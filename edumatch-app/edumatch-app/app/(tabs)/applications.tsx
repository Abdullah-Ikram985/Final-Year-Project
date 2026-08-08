import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Clock, FileText } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const APPLICATIONS = [
  { id: "1", uni: "Stanford University", role: "Assistant Professor", dept: "Computer Science", appliedDate: "Apr 12, 2026", status: "Under Review", statusColor: "#f59e0b", statusBg: "#fffbeb", initials: "SU", color: "#dc2626", match: 94 },
  { id: "2", uni: "MIT", role: "Associate Professor", dept: "AI & ML", appliedDate: "Apr 8, 2026", status: "Interview Scheduled", statusColor: "#10b981", statusBg: "#f0fdf4", initials: "MI", color: "#7c3aed", match: 91, interviewDate: "Apr 22, 2026" },
  { id: "3", uni: "LUMS", role: "Visiting Lecturer", dept: "Data Science", appliedDate: "Mar 30, 2026", status: "Submitted", statusColor: "#3b82f6", statusBg: "#eff6ff", initials: "LU", color: "#0369a1", match: 78 },
  { id: "4", uni: "IISAT University", role: "Senior Lecturer", dept: "Software Engineering", appliedDate: "Mar 22, 2026", status: "Rejected", statusColor: "#ef4444", statusBg: "#fef2f2", initials: "II", color: "#6b7280", match: 65 },
];

const STATUS_TABS = ["All", "Active", "Interview", "Closed"];

export default function ApplicationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("All");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = APPLICATIONS.filter((a) => {
    if (activeTab === "All") return true;
    if (activeTab === "Active") return a.status === "Under Review" || a.status === "Submitted";
    if (activeTab === "Interview") return a.status === "Interview Scheduled";
    if (activeTab === "Closed") return a.status === "Rejected";
    return true;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerSub}>Track your application progress</Text>
        <View style={styles.statsRow}>
          {[
            { label: "Total", value: "4", bg: "rgba(255,255,255,0.15)" },
            { label: "Active", value: "2", bg: "rgba(59,130,246,0.3)" },
            { label: "Interview", value: "1", bg: "rgba(16,185,129,0.3)" },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { backgroundColor: s.bg }]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {STATUS_TABS.map((t) => (
          <Pressable key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item: app }) => (
          <View style={[styles.appCard, { backgroundColor: colors.card }]}>
            {app.status === "Interview Scheduled" && (
              <View style={styles.interviewBanner}>
                <Calendar size={12} color="#10b981" />
                <Text style={styles.interviewBannerText}>Interview on {(app as any).interviewDate}</Text>
              </View>
            )}
            <View style={styles.appTop}>
              <View style={[styles.appAvatar, { backgroundColor: app.color + "18" }]}>
                <Text style={[styles.appAvatarText, { color: app.color }]}>{app.initials}</Text>
              </View>
              <View style={styles.appMeta}>
                <Text style={[styles.appRole, { color: colors.foreground }]}>{app.role}</Text>
                <Text style={[styles.appUni, { color: colors.mutedForeground }]}>{app.uni}</Text>
                <Text style={[styles.appDept, { color: colors.mutedForeground }]}>{app.dept}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: app.statusBg }]}>
                <Text style={[styles.statusText, { color: app.statusColor }]}>{app.status}</Text>
              </View>
            </View>
            <View style={styles.appFooter}>
              <View style={styles.footerLeft}>
                <Clock size={12} color={colors.mutedForeground} />
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Applied {app.appliedDate}</Text>
              </View>
              <View style={styles.matchPill}>
                <Text style={styles.matchText}>{app.match}% match</Text>
              </View>
            </View>
            <View style={styles.timeline}>
              {["Submitted", "Under Review", "Interview", "Decision"].map((step, i) => {
                const activeIndex = app.status === "Submitted" ? 0 : app.status === "Under Review" ? 1 : app.status === "Interview Scheduled" ? 2 : app.status === "Rejected" ? 1 : 0;
                const done = i <= activeIndex;
                return (
                  <React.Fragment key={step}>
                    <View style={styles.timelineStep}>
                      <View style={[styles.timelineDot, done ? styles.timelineDotDone : styles.timelineDotPending]} />
                      <Text style={[styles.timelineLabel, { color: done ? "#7c3aed" : colors.mutedForeground }]} numberOfLines={1}>{step}</Text>
                    </View>
                    {i < 3 && <View style={[styles.timelineLine, { backgroundColor: done && i < activeIndex ? "#7c3aed" : "#e5e0f8" }]} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={40} color="#c4b5fd" />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No applications here</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>Apply to jobs to track them here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  headerDecor: { position: "absolute", top: -20, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(124,58,237,0.15)" },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(196,181,253,0.8)", fontFamily: "Inter_400Regular", marginBottom: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statItem: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 2 },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(196,181,253,0.8)" },
  tabs: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#7c3aed" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#8b7dc0" },
  tabTextActive: { color: "#7c3aed" },
  list: { padding: 16, gap: 12 },
  appCard: { borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  interviewBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 12 },
  interviewBannerText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#10b981" },
  appTop: { flexDirection: "row", gap: 12, marginBottom: 12 },
  appAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  appAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  appMeta: { flex: 1 },
  appRole: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  appUni: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 1 },
  appDept: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  appFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  matchPill: { backgroundColor: "#f0eeff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  matchText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#7c3aed" },
  timeline: { flexDirection: "row", alignItems: "center" },
  timelineStep: { alignItems: "center", gap: 4, flex: 1 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineDotDone: { backgroundColor: "#7c3aed" },
  timelineDotPending: { backgroundColor: "#e5e0f8" },
  timelineLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textAlign: "center" },
  timelineLine: { flex: 1, height: 2, marginBottom: 14 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
