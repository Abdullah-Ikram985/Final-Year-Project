import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Clock,
  Laptop,
  Rocket,
  TrendingUp,
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

import { useColors } from "@/hooks/useColors";

const TARGET_ROLES = [
  { label: "Professor of AI/ML", match: 71 },
  { label: "Associate Professor CS", match: 84 },
  { label: "Research Scientist", match: 78 },
];

const MISSING_SKILLS = [
  { skill: "Research Publications", priority: "High", courses: 2 },
  { skill: "TensorFlow Advanced", priority: "High", courses: 3 },
  { skill: "Grant Writing", priority: "Medium", courses: 1 },
  { skill: "Curriculum Design", priority: "Low", courses: 2 },
];

const COURSES = [
  { id: "1", title: "Advanced TensorFlow & Keras", platform: "Coursera", duration: "6 weeks", level: "Advanced", skill: "TensorFlow Advanced", color: "#3b82f6", bg: "#eff6ff" },
  { id: "2", title: "Academic Research Writing", platform: "edX", duration: "4 weeks", level: "Intermediate", skill: "Research Publications", color: "#10b981", bg: "#f0fdf4" },
  { id: "3", title: "Grant Proposal Masterclass", platform: "Udemy", duration: "8 hours", level: "Beginner", skill: "Grant Writing", color: "#f59e0b", bg: "#fffbeb" },
];

export default function CareerRoadmapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState(0);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const currentMatch = TARGET_ROLES[selectedRole].match;
  const targetMatch = 90;
  const gap = targetMatch - currentMatch;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color="rgba(196,181,253,0.9)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Career Roadmap</Text>
            <Text style={styles.headerSub}>AI-Powered Career Counselor</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.roleSelector}>
          <Text style={styles.roleSelectorLabel}>Target Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChips}>
            {TARGET_ROLES.map((r, i) => (
              <Pressable key={i} style={[styles.roleChip, selectedRole === i && styles.roleChipActive]} onPress={() => { setSelectedRole(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Text style={[styles.roleChipText, selectedRole === i && styles.roleChipTextActive]}>{r.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.matchCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.matchSummary, { color: colors.foreground }]}>
            You're <Text style={styles.matchPercent}>{currentMatch}% match</Text> — here's what to improve
          </Text>
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <View><Text style={[styles.progLabelSub, { color: colors.mutedForeground }]}>Current</Text><Text style={[styles.progLabelVal, { color: "#7c3aed" }]}>{currentMatch}%</Text></View>
              <View style={styles.progArrow}>
                <ArrowRight size={16} color={colors.mutedForeground} />
                <Text style={[styles.progGapText, { color: colors.mutedForeground }]}>+{gap}% needed</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}><Text style={[styles.progLabelSub, { color: colors.mutedForeground }]}>Target</Text><Text style={[styles.progLabelVal, { color: "#10b981" }]}>{targetMatch}%</Text></View>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { width: `${currentMatch}%` as any }]} />
              <View style={[styles.targetMarker, { left: `${targetMatch}%` as any }]} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View style={[styles.sectionIconWrap, { backgroundColor: "#fef2f2" }]}><AlertCircle size={16} color="#ef4444" /></View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Missing Skills</Text>
        </View>

        <View style={styles.missingSkillsWrap}>
          {MISSING_SKILLS.map((s) => {
            const priorityColor = s.priority === "High" ? "#ef4444" : s.priority === "Medium" ? "#f59e0b" : "#3b82f6";
            const priorityBg = s.priority === "High" ? "#fef2f2" : s.priority === "Medium" ? "#fffbeb" : "#eff6ff";
            return (
              <View key={s.skill} style={[styles.missingSkill, { backgroundColor: colors.card }]}>
                <View style={[styles.missingSkillPriority, { backgroundColor: priorityBg }]}>
                  <Text style={[styles.missingSkillPriorityText, { color: priorityColor }]}>{s.priority}</Text>
                </View>
                <Text style={[styles.missingSkillName, { color: colors.foreground }]}>{s.skill}</Text>
                <Text style={[styles.missingSkillCourses, { color: colors.mutedForeground }]}>{s.courses} courses available</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHead}>
          <View style={[styles.sectionIconWrap, { backgroundColor: "#f0eeff" }]}><BookOpen size={16} color="#7c3aed" /></View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recommended Courses</Text>
        </View>

        <View style={styles.coursesList}>
          {COURSES.map((course) => (
            <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card }]}>
              <View style={[styles.courseIcon, { backgroundColor: course.bg }]}>
                <BookOpen size={22} color={course.color} />
              </View>
              <View style={styles.courseMeta}>
                <Text style={[styles.courseTitle, { color: colors.foreground }]}>{course.title}</Text>
                <View style={styles.courseTags}>
                  <View style={styles.courseTag}><Laptop size={10} color={colors.mutedForeground} /><Text style={[styles.courseTagText, { color: colors.mutedForeground }]}>{course.platform}</Text></View>
                  <View style={styles.courseTag}><Clock size={10} color={colors.mutedForeground} /><Text style={[styles.courseTagText, { color: colors.mutedForeground }]}>{course.duration}</Text></View>
                  <View style={[styles.courseLevelTag, { backgroundColor: course.bg }]}><Text style={[styles.courseLevelText, { color: course.color }]}>{course.level}</Text></View>
                </View>
                <View style={[styles.courseSkillTag, { backgroundColor: "#f0eeff" }]}>
                  <Text style={styles.courseSkillTagText}>Fills: {course.skill}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.startBtn, { backgroundColor: course.bg }]}>
                <ArrowRight size={14} color={course.color} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.88 }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
          <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.ctaGradient}>
            <Rocket size={18} color="#fff" />
            <Text style={styles.ctaText}>Start Learning Path</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  headerDecor: { position: "absolute", top: -20, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(124,58,237,0.15)" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
  headerSub: { fontSize: 11, color: "rgba(196,181,253,0.7)", fontFamily: "Inter_400Regular" },
  roleSelector: {},
  roleSelectorLabel: { fontSize: 11, color: "rgba(196,181,253,0.7)", fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  roleChips: { gap: 8, paddingRight: 4 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(196,181,253,0.2)" },
  roleChipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  roleChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(196,181,253,0.8)" },
  roleChipTextActive: { color: "#ffffff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  matchCard: { borderRadius: 18, padding: 18, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  matchSummary: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 16, lineHeight: 22 },
  matchPercent: { color: "#7c3aed", fontFamily: "Inter_700Bold" },
  progressSection: { gap: 10 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progLabelSub: { fontSize: 10, fontFamily: "Inter_500Medium", marginBottom: 2 },
  progLabelVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  progArrow: { alignItems: "center", gap: 2 },
  progGapText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  progressBarBg: { height: 10, borderRadius: 5, position: "relative", overflow: "visible" },
  progressBarFill: { height: "100%", backgroundColor: "#7c3aed", borderRadius: 5 },
  targetMarker: { position: "absolute", top: -3, width: 2, height: 16, backgroundColor: "#10b981", borderRadius: 1 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  missingSkillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  missingSkill: { width: "47%", borderRadius: 14, padding: 14, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  missingSkillPriority: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 8 },
  missingSkillPriorityText: { fontSize: 9, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  missingSkillName: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 4 },
  missingSkillCourses: { fontSize: 10, fontFamily: "Inter_400Regular" },
  coursesList: { gap: 10 },
  courseCard: { borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  courseIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  courseMeta: { flex: 1, gap: 6 },
  courseTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  courseTags: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  courseTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  courseTagText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  courseLevelTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  courseLevelText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  courseSkillTag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  courseSkillTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  startBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "center", flexShrink: 0 },
  ctaBtn: { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  ctaGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17 },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
});
