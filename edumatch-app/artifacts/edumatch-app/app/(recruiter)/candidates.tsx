import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Bookmark,
  CheckCircle,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
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

const FILTERS = ["All", "AI/ML", "CS", "Data Science", "Mathematics"];
const TABS = ["All Candidates", "Shortlisted"];

const CANDIDATES = [
  { id: "1", name: "Dr. Aisha Raza", role: "Assistant Professor", current: "IISAT University", loc: "Lahore, PK", exp: "6 yrs", match: 96, initials: "AR", color: "#7c3aed", skills: ["Python", "ML", "NLP", "TensorFlow"], degree: "PhD MIT", topMatch: true },
  { id: "2", name: "Dr. James Chen", role: "Senior Lecturer", current: "Berkeley", loc: "San Francisco, CA", exp: "8 yrs", match: 91, initials: "JC", color: "#3b82f6", skills: ["AI", "Research", "DL"], degree: "PhD Stanford", topMatch: false },
  { id: "3", name: "Dr. Maria Lopez", role: "Researcher", current: "Carnegie Mellon", loc: "Pittsburgh, PA", exp: "5 yrs", match: 88, initials: "ML", color: "#10b981", skills: ["Data Science", "Statistics"], degree: "PhD CMU", topMatch: false },
  { id: "4", name: "Dr. Hassan Ali", role: "Lecturer", current: "LUMS", loc: "Lahore, PK", exp: "4 yrs", match: 84, initials: "HA", color: "#f59e0b", skills: ["NLP", "Python"], degree: "PhD Oxford", topMatch: false },
  { id: "5", name: "Dr. Emily Park", role: "Postdoc Researcher", current: "MIT", loc: "Cambridge, MA", exp: "3 yrs", match: 79, initials: "EP", color: "#dc2626", skills: ["Computer Vision", "PyTorch"], degree: "PhD MIT", topMatch: false },
];

export default function CandidatesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("All Candidates");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [shortlisted, setShortlisted] = useState<string[]>(["1", "2"]);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = CANDIDATES.filter((c) => {
    if (tab === "Shortlisted" && !shortlisted.includes(c.id)) return false;
    if (search && !(c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()) || c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())))) return false;
    if (filter !== "All" && !c.skills.some((s) => s.toLowerCase().includes(filter.toLowerCase().split("/")[0]))) {
      if (filter === "CS" && c.role.toLowerCase().includes("computer")) return true;
      return false;
    }
    return true;
  }).sort((a, b) => b.match - a.match);

  const toggleShortlist = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShortlisted((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <Text style={styles.headerTitle}>Find Candidates</Text>
        <Text style={styles.headerSub}>AI-ranked matches for your roles</Text>
        <View style={styles.searchBar}>
          <Search size={18} color="#8b7dc0" />
          <TextInput style={styles.searchInput} placeholder="Search by name, skill, role..." placeholderTextColor="#8b7dc0" value={search} onChangeText={setSearch} />
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal size={18} color="#7c3aed" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            {t === "Shortlisted" && shortlisted.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{shortlisted.length}</Text></View>
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={[styles.filtersWrap, { backgroundColor: colors.card }]}>
        {FILTERS.map((f) => (
          <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item: c, index }) => (
          <TouchableOpacity style={[styles.candCard, { backgroundColor: colors.card }, c.topMatch && styles.candCardTop]} onPress={() => router.push({ pathname: "/candidate-detail", params: { id: c.id } })}>
            {c.topMatch && (
              <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.bestBadge}>
                <Star size={10} color="#fff" fill="#fff" />
                <Text style={styles.bestBadgeText}>Top Match #{index + 1}</Text>
              </LinearGradient>
            )}
            <View style={styles.cardTop}>
              <View style={[styles.avatar, { backgroundColor: c.color + "20" }]}>
                <Text style={[styles.avatarText, { color: c.color }]}>{c.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{c.name}</Text>
                  <View style={[styles.matchPill, { backgroundColor: c.match >= 90 ? "#f0fdf4" : "#f0eeff" }]}>
                    <Sparkles size={10} color={c.match >= 90 ? "#10b981" : "#7c3aed"} />
                    <Text style={[styles.matchText, { color: c.match >= 90 ? "#10b981" : "#7c3aed" }]}>{c.match}%</Text>
                  </View>
                </View>
                <Text style={[styles.role, { color: colors.mutedForeground }]}>{c.role} · {c.current}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaTag}>
                <GraduationCap size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{c.degree}</Text>
              </View>
              <View style={styles.metaTag}>
                <MapPin size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{c.loc}</Text>
              </View>
              <View style={styles.metaTag}>
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{c.exp} exp</Text>
              </View>
            </View>

            <View style={styles.skillsWrap}>
              {c.skills.slice(0, 4).map((s) => (
                <View key={s} style={styles.skillTag}><Text style={styles.skillTagText}>{s}</Text></View>
              ))}
            </View>

            <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.actionBtn, shortlisted.includes(c.id) && styles.actionBtnActive]} onPress={(e) => { e.stopPropagation?.(); toggleShortlist(c.id); }}>
                <Bookmark size={14} color={shortlisted.includes(c.id) ? "#7c3aed" : colors.mutedForeground} fill={shortlisted.includes(c.id) ? "#7c3aed" : "none"} />
                <Text style={[styles.actionBtnText, { color: shortlisted.includes(c.id) ? "#7c3aed" : colors.mutedForeground }]}>{shortlisted.includes(c.id) ? "Shortlisted" : "Shortlist"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hireBtn} onPress={() => router.push({ pathname: "/candidate-detail", params: { id: c.id } })}>
                <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.hireBtnGrad}>
                  <CheckCircle size={14} color="#fff" />
                  <Text style={styles.hireBtnText}>View & Hire</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={40} color="#c4b5fd" />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No candidates found</Text>
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
  tabs: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent", flexDirection: "row", justifyContent: "center", gap: 6 },
  tabActive: { borderBottomColor: "#7c3aed" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#8b7dc0" },
  tabTextActive: { color: "#7c3aed" },
  tabBadge: { backgroundColor: "#7c3aed", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: "center" },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  filtersWrap: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: "#e5e0f8" },
  filters: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f0eeff", borderWidth: 1, borderColor: "#e5e0f8" },
  filterChipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  filterChipTextActive: { color: "#ffffff" },
  list: { padding: 16, gap: 12 },
  candCard: { borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  candCardTop: { borderWidth: 1.5, borderColor: "#7c3aed" },
  bestBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  bestBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#ffffff" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3, gap: 8 },
  name: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  matchPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  matchText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  role: { fontSize: 12, fontFamily: "Inter_500Medium" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  metaTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f8f7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  metaText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 14 },
  skillTag: { backgroundColor: "#ede9fe", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  skillTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  cardActions: { flexDirection: "row", gap: 8, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#f8f7ff", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  actionBtnActive: { backgroundColor: "#f0eeff" },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  hireBtn: { borderRadius: 10, overflow: "hidden", flex: 1 },
  hireBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10 },
  hireBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#ffffff" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
