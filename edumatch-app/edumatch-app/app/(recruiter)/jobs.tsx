import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Briefcase,
  Calendar,
  Eye,
  MapPin,
  MoreVertical,
  Plus,
  Users,
} from "lucide-react-native";
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

const POSTED_JOBS = [
  { id: "1", title: "Assistant Professor – CS", dept: "Computer Science", loc: "Stanford, CA", type: "Full-time", posted: "Apr 15, 2026", applicants: 24, views: 312, status: "Active", statusBg: "#f0fdf4", statusColor: "#10b981" },
  { id: "2", title: "Associate Professor – AI/ML", dept: "AI & ML", loc: "Stanford, CA", type: "Full-time", posted: "Apr 10, 2026", applicants: 18, views: 287, status: "Active", statusBg: "#f0fdf4", statusColor: "#10b981" },
  { id: "3", title: "Research Scientist", dept: "Data Science", loc: "Remote", type: "Contract", posted: "Apr 5, 2026", applicants: 41, views: 524, status: "Active", statusBg: "#f0fdf4", statusColor: "#10b981" },
  { id: "4", title: "Visiting Lecturer", dept: "Mathematics", loc: "Stanford, CA", type: "Part-time", posted: "Mar 28, 2026", applicants: 12, views: 198, status: "Closed", statusBg: "#f3f4f6", statusColor: "#6b7280" },
  { id: "5", title: "Senior Researcher – NLP", dept: "Linguistics", loc: "Stanford, CA", type: "Full-time", posted: "Mar 20, 2026", applicants: 31, views: 412, status: "Draft", statusBg: "#fffbeb", statusColor: "#f59e0b" },
];

const FILTERS = ["All", "Active", "Draft", "Closed"];

export default function RecruiterJobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = POSTED_JOBS.filter((j) => filter === "All" || j.status === filter);
  const totalApplicants = POSTED_JOBS.reduce((acc, j) => acc + j.applicants, 0);
  const activeCount = POSTED_JOBS.filter((j) => j.status === "Active").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Job Postings</Text>
            <Text style={styles.headerSub}>Manage your active openings</Text>
          </View>
          <TouchableOpacity style={styles.postBtn} onPress={() => router.push("/post-job")}>
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.postBtnGrad}>
              <Plus size={16} color="#fff" />
              <Text style={styles.postBtnText}>Post Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          {[
            { label: "Total Posted", value: String(POSTED_JOBS.length), bg: "rgba(255,255,255,0.15)" },
            { label: "Active", value: String(activeCount), bg: "rgba(16,185,129,0.3)" },
            { label: "Applicants", value: String(totalApplicants), bg: "rgba(124,58,237,0.3)" },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { backgroundColor: s.bg }]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {FILTERS.map((t) => (
          <Pressable key={t} style={[styles.tab, filter === t && styles.tabActive]} onPress={() => setFilter(t)}>
            <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(j) => j.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item: job }) => (
          <View style={[styles.jobCard, { backgroundColor: colors.card }]}>
            <View style={styles.jobTop}>
              <View style={styles.jobIcon}>
                <Briefcase size={20} color="#7c3aed" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
                <Text style={[styles.jobDept, { color: colors.mutedForeground }]}>{job.dept}</Text>
              </View>
              <TouchableOpacity style={styles.moreBtn}>
                <MoreVertical size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={styles.jobMetaRow}>
              <View style={styles.jobMetaTag}>
                <MapPin size={11} color={colors.mutedForeground} />
                <Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>{job.loc}</Text>
              </View>
              <View style={styles.jobMetaTag}>
                <Calendar size={11} color={colors.mutedForeground} />
                <Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>{job.posted}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: job.statusBg }]}>
                <Text style={[styles.statusText, { color: job.statusColor }]}>{job.status}</Text>
              </View>
            </View>

            <View style={[styles.jobStats, { borderTopColor: colors.border }]}>
              <View style={styles.jobStatItem}>
                <Users size={14} color="#7c3aed" />
                <Text style={[styles.jobStatValue, { color: colors.foreground }]}>{job.applicants}</Text>
                <Text style={[styles.jobStatLabel, { color: colors.mutedForeground }]}>Applicants</Text>
              </View>
              <View style={[styles.jobStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.jobStatItem}>
                <Eye size={14} color="#3b82f6" />
                <Text style={[styles.jobStatValue, { color: colors.foreground }]}>{job.views}</Text>
                <Text style={[styles.jobStatLabel, { color: colors.mutedForeground }]}>Views</Text>
              </View>
              <TouchableOpacity style={styles.viewCandsBtn} onPress={() => router.push("/(recruiter)/candidates")}>
                <Text style={styles.viewCandsText}>View Candidates</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Briefcase size={40} color="#c4b5fd" />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No jobs in this status</Text>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#ffffff" },
  headerSub: { fontSize: 13, color: "rgba(196,181,253,0.8)", fontFamily: "Inter_400Regular", marginTop: 2 },
  postBtn: { borderRadius: 12, overflow: "hidden" },
  postBtnGrad: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
  postBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#ffffff" },
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
  jobCard: { borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  jobTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  jobIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#f0eeff", alignItems: "center", justifyContent: "center" },
  jobTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  jobDept: { fontSize: 12, fontFamily: "Inter_500Medium" },
  moreBtn: { padding: 4 },
  jobMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  jobMetaTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f8f7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  jobMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  jobStats: { flexDirection: "row", alignItems: "center", paddingTop: 12, borderTopWidth: 1, gap: 12 },
  jobStatItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  jobStatValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  jobStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  jobStatDivider: { width: 1, height: 18 },
  viewCandsBtn: { marginLeft: "auto", backgroundColor: "#f0eeff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  viewCandsText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#7c3aed" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
