import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  Banknote,
  Bookmark,
  Briefcase,
  MapPin,
  School,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FILTERS = ["All", "CS", "AI/ML", "Mathematics", "Physics", "Remote"];

const JOBS = [
  { id: "1", uni: "Stanford University", role: "Assistant Professor", dept: "Computer Science", loc: "Stanford, CA", salary: "$120k–$160k", match: 96, initials: "SU", color: "#dc2626", type: "Full-time", bestMatch: true },
  { id: "2", uni: "MIT", role: "Associate Professor", dept: "AI & Machine Learning", loc: "Cambridge, MA", salary: "$140k–$180k", match: 91, initials: "MI", color: "#7c3aed", type: "Full-time", bestMatch: false },
  { id: "3", uni: "Carnegie Mellon", role: "Lecturer", dept: "Data Science", loc: "Pittsburgh, PA", salary: "$90k–$120k", match: 84, initials: "CM", color: "#0369a1", type: "Full-time", bestMatch: false },
  { id: "4", uni: "UC Berkeley", role: "Visiting Professor", dept: "Machine Learning", loc: "Berkeley, CA", salary: "$110k–$140k", match: 78, initials: "UC", color: "#d97706", type: "Remote", bestMatch: false },
  { id: "5", uni: "Georgia Tech", role: "Assistant Professor", dept: "AI Research", loc: "Atlanta, GA", salary: "$100k–$130k", match: 74, initials: "GT", color: "#10b981", type: "Full-time", bestMatch: false },
];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [savedJobs, setSavedJobs] = useState<string[]>(["2"]);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = JOBS.filter(
    (j) => (activeFilter === "All" || j.dept.toLowerCase().includes(activeFilter.toLowerCase()) || j.type === activeFilter) &&
      (search === "" || j.role.toLowerCase().includes(search.toLowerCase()) || j.uni.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSave = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedJobs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <Text style={styles.headerTitle}>Job Recommendations</Text>
        <Text style={styles.headerSub}>AI-curated matches for your profile</Text>
        <View style={styles.searchBar}>
          <Search size={18} color="#8b7dc0" />
          <TextInput style={styles.searchInput} placeholder="Search roles, universities..." placeholderTextColor="#8b7dc0" value={search} onChangeText={setSearch} />
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal size={18} color="#7c3aed" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={[styles.filtersWrap, { backgroundColor: colors.card }]}>
        {FILTERS.map((f) => (
          <Pressable key={f} style={[styles.filterChip, activeFilter === f && styles.filterChipActive]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(j) => j.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item: job }) => (
          <View style={[styles.jobCard, { backgroundColor: colors.card }, job.bestMatch && styles.jobCardBest]}>
            {job.bestMatch && (
              <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.bestBadge}>
                <Sparkles size={10} color="#fff" />
                <Text style={styles.bestBadgeText}>Best Match</Text>
              </LinearGradient>
            )}
            <View style={styles.jobTop}>
              <View style={[styles.jobAvatar, { backgroundColor: job.color + "18" }]}>
                <Text style={[styles.jobAvatarText, { color: job.color }]}>{job.initials}</Text>
              </View>
              <View style={styles.jobTopMeta}>
                <Text style={[styles.jobRole, { color: colors.foreground }]}>{job.role}</Text>
                <Text style={[styles.jobUni, { color: colors.mutedForeground }]}>{job.uni}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleSave(job.id)} style={styles.bookmarkBtn}>
                <Bookmark size={20} color={savedJobs.includes(job.id) ? "#7c3aed" : colors.mutedForeground} fill={savedJobs.includes(job.id) ? "#7c3aed" : "none"} />
              </TouchableOpacity>
            </View>
            <View style={styles.jobMeta}>
              <View style={styles.jobMetaTag}><School size={12} color={colors.mutedForeground} /><Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>{job.dept}</Text></View>
              <View style={styles.jobMetaTag}><MapPin size={12} color={colors.mutedForeground} /><Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>{job.loc}</Text></View>
              <View style={styles.jobMetaTag}><Banknote size={12} color={colors.mutedForeground} /><Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>{job.salary}</Text></View>
            </View>
            <View style={styles.jobBottom}>
              <View style={[styles.matchPill, { backgroundColor: job.match >= 90 ? "#f0fdf4" : "#f0eeff" }]}>
                <View style={[styles.matchDot, { backgroundColor: job.match >= 90 ? "#10b981" : "#7c3aed" }]} />
                <Text style={[styles.matchPillText, { color: job.match >= 90 ? "#10b981" : "#7c3aed" }]}>{job.match}% Match</Text>
              </View>
              <TouchableOpacity style={[styles.applyBtn, job.bestMatch && styles.applyBtnBest]}>
                {job.bestMatch ? (
                  <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.applyGradient}>
                    <Text style={styles.applyBtnText}>Quick Apply</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.applyBtnText, { color: "#1e1b4b" }]}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={40} color="#c4b5fd" />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No jobs found</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>Try a different search or filter</Text>
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
  headerSub: { fontSize: 13, color: "rgba(196,181,253,0.8)", fontFamily: "Inter_400Regular", marginBottom: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingHorizontal: 14, height: 46, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#ffffff" },
  filterBtn: { padding: 4 },
  filtersWrap: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: "#e5e0f8" },
  filters: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f0eeff", borderWidth: 1, borderColor: "#e5e0f8" },
  filterChipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  filterChipTextActive: { color: "#ffffff" },
  list: { padding: 16, gap: 12 },
  jobCard: { borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, overflow: "hidden" },
  jobCardBest: { borderWidth: 1.5, borderColor: "#7c3aed" },
  bestBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  bestBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#ffffff" },
  jobTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  jobAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  jobAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  jobTopMeta: { flex: 1 },
  jobRole: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  jobUni: { fontSize: 12, fontFamily: "Inter_500Medium" },
  bookmarkBtn: { padding: 4 },
  jobMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  jobMetaTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f8f7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  jobMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  jobBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  matchPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  matchDot: { width: 6, height: 6, borderRadius: 3 },
  matchPillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  applyBtn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: "#f0eeff", overflow: "hidden" },
  applyBtnBest: { backgroundColor: "transparent", padding: 0 },
  applyGradient: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  applyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#ffffff" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
