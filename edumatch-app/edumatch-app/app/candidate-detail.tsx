import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  Award,
  Bookmark,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Code2,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  School,
  Sparkles,
  Star,
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
import Svg, { Circle } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const CANDIDATES: Record<string, any> = {
  "1": { name: "Dr. Aisha Raza", initials: "AR", color: "#7c3aed", role: "Assistant Professor", current: "IISAT University", loc: "Lahore, PK", exp: "6 years", match: 96, email: "aisha.raza@iisat.edu.pk", phone: "+92 300 1234567", bio: "AI researcher and educator with 6+ years of experience in machine learning, NLP, and deep learning. Published 12 research papers in top-tier conferences." },
  "2": { name: "Dr. James Chen", initials: "JC", color: "#3b82f6", role: "Senior Lecturer", current: "Berkeley", loc: "San Francisco, CA", exp: "8 years", match: 91, email: "jchen@berkeley.edu", phone: "+1 555 0102", bio: "Expert in artificial intelligence with focus on reinforcement learning. Led multiple NSF-funded projects." },
  "3": { name: "Dr. Maria Lopez", initials: "ML", color: "#10b981", role: "Researcher", current: "Carnegie Mellon", loc: "Pittsburgh, PA", exp: "5 years", match: 88, email: "mlopez@cmu.edu", phone: "+1 555 0103", bio: "Data science specialist with extensive experience in statistical modeling and predictive analytics." },
};

const SKILLS = ["Python", "Machine Learning", "NLP", "TensorFlow", "Deep Learning", "Data Analysis", "Research Methods", "Scikit-learn"];
const EDUCATION = [
  { degree: "PhD Computer Science", uni: "MIT", year: "2019" },
  { degree: "MS Artificial Intelligence", uni: "LUMS", year: "2015" },
];
const EXPERIENCE = [
  { role: "Assistant Professor", place: "IISAT University", period: "2020 – Present" },
  { role: "Research Fellow", place: "Stanford AI Lab", period: "2018 – 2020" },
  { role: "Lecturer", place: "LUMS", period: "2015 – 2018" },
];

export default function CandidateDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const candidate = CANDIDATES[params.id ?? "1"] ?? CANDIDATES["1"];
  const [shortlisted, setShortlisted] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const circumference = 2 * Math.PI * 28;
  const dashoffset = circumference - (candidate.match / 100) * circumference;

  const toggleShortlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShortlisted(!shortlisted);
  };

  const handleHire = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color="rgba(196,181,253,0.9)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Candidate Profile</Text>
          <TouchableOpacity onPress={toggleShortlist} style={styles.bookmarkBtn}>
            <Bookmark size={20} color={shortlisted ? "#a855f7" : "rgba(196,181,253,0.9)"} fill={shortlisted ? "#a855f7" : "none"} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileTop}>
          <View style={[styles.avatar, { backgroundColor: candidate.color + "30" }]}>
            <Text style={[styles.avatarText, { color: "#fff" }]}>{candidate.initials}</Text>
          </View>
          <Text style={styles.name}>{candidate.name}</Text>
          <Text style={styles.role}>{candidate.role}</Text>
          <Text style={styles.current}>{candidate.current}</Text>
          <View style={styles.locRow}>
            <MapPin size={11} color="rgba(196,181,253,0.7)" />
            <Text style={styles.locText}>{candidate.loc} · {candidate.exp} experience</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.matchCard, { backgroundColor: colors.card }]}>
          <View style={styles.matchLeft}>
            <View style={styles.circleWrap}>
              <Svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: [{ rotate: "-90deg" }] }}>
                <Circle cx="32" cy="32" r="28" fill="none" stroke="#e5e0f8" strokeWidth="5" />
                <Circle cx="32" cy="32" r="28" fill="none" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashoffset} />
              </Svg>
              <View style={styles.circleInner}>
                <Text style={styles.circleScore}>{candidate.match}</Text>
                <Text style={styles.circlePercent}>%</Text>
              </View>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.aiTitle}>
              <Sparkles size={14} color="#7c3aed" />
              <Text style={[styles.aiTitleText, { color: colors.foreground }]}>AI Match Score</Text>
            </View>
            <Text style={[styles.matchDesc, { color: colors.mutedForeground }]}>This candidate is a {candidate.match >= 90 ? "perfect" : "strong"} fit for your Assistant Professor – CS posting</Text>
            <View style={styles.matchTags}>
              <View style={[styles.matchTag, { backgroundColor: "#f0fdf4" }]}>
                <Star size={10} color="#10b981" fill="#10b981" />
                <Text style={[styles.matchTagText, { color: "#10b981" }]}>Top 5%</Text>
              </View>
              <View style={[styles.matchTag, { backgroundColor: "#f0eeff" }]}>
                <TrendingUp size={10} color="#7c3aed" />
                <Text style={[styles.matchTagText, { color: "#7c3aed" }]}>High potential</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.contactBtn}>
            <Mail size={16} color="#7c3aed" />
            <Text style={[styles.contactBtnText, { color: colors.foreground }]}>Email</Text>
          </TouchableOpacity>
          <View style={[styles.contactDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.contactBtn}>
            <Phone size={16} color="#10b981" />
            <Text style={[styles.contactBtnText, { color: colors.foreground }]}>Call</Text>
          </TouchableOpacity>
          <View style={[styles.contactDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.contactBtn}>
            <MessageCircle size={16} color="#3b82f6" />
            <Text style={[styles.contactBtnText, { color: colors.foreground }]}>Message</Text>
          </TouchableOpacity>
          <View style={[styles.contactDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.contactBtn}>
            <Calendar size={16} color="#f59e0b" />
            <Text style={[styles.contactBtnText, { color: colors.foreground }]}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <Section title="About" Icon={FileText} colors={colors}>
          <Text style={[styles.bio, { color: colors.foreground }]}>{candidate.bio}</Text>
        </Section>

        <Section title="Skills" Icon={Code2} colors={colors}>
          <View style={styles.skillsWrap}>
            {SKILLS.map((s) => <View key={s} style={styles.skillPill}><Text style={styles.skillText}>{s}</Text></View>)}
          </View>
        </Section>

        <Section title="Education" Icon={GraduationCap} colors={colors}>
          {EDUCATION.map((e, i) => (
            <View key={e.degree} style={[styles.timelineItem, i < EDUCATION.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.timelineIcon, { backgroundColor: "#eff6ff" }]}><School size={16} color="#3b82f6" /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{e.degree}</Text>
                <Text style={[styles.timelineSub, { color: colors.mutedForeground }]}>{e.uni} · {e.year}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Experience" Icon={Briefcase} colors={colors}>
          {EXPERIENCE.map((e, i) => (
            <View key={e.role} style={[styles.timelineItem, i < EXPERIENCE.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.timelineIcon, { backgroundColor: "#f0fdf4" }]}><Briefcase size={16} color="#10b981" /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{e.role}</Text>
                <Text style={[styles.timelineSub, { color: colors.mutedForeground }]}>{e.place} · {e.period}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Achievements" Icon={Award} colors={colors}>
          {[
            "12 published research papers in IEEE & ACM",
            "Best Paper Award at NeurIPS 2023",
            "Led 4 NSF-funded research projects",
          ].map((a) => (
            <View key={a} style={styles.achieveRow}>
              <View style={styles.achieveDot} />
              <Text style={[styles.achieveText, { color: colors.foreground }]}>{a}</Text>
            </View>
          ))}
        </Section>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomInset + 12 }]}>
        <Pressable style={({ pressed }) => [styles.shortlistBtn, shortlisted && styles.shortlistBtnActive, pressed && { opacity: 0.85 }]} onPress={toggleShortlist}>
          <Bookmark size={16} color={shortlisted ? "#7c3aed" : "#8b7dc0"} fill={shortlisted ? "#7c3aed" : "none"} />
          <Text style={[styles.shortlistText, shortlisted && { color: "#7c3aed" }]}>{shortlisted ? "Shortlisted" : "Shortlist"}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.hireBtn, pressed && { opacity: 0.88 }]} onPress={handleHire}>
          <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.hireGrad}>
            <CheckCircle size={16} color="#fff" />
            <Text style={styles.hireText}>Hire Candidate</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, Icon, children, colors }: { title: string; Icon: any; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}><Icon size={16} color="#7c3aed" /></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24, overflow: "hidden" },
  headerDecor: { position: "absolute", top: -20, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(124,58,237,0.15)" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
  bookmarkBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  profileTop: { alignItems: "center" },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 3, borderColor: "rgba(255,255,255,0.2)" },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 4 },
  role: { fontSize: 13, color: "rgba(196,181,253,0.9)", fontFamily: "Inter_500Medium" },
  current: { fontSize: 12, color: "rgba(196,181,253,0.7)", fontFamily: "Inter_400Regular", marginBottom: 8 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  locText: { fontSize: 11, color: "rgba(196,181,253,0.85)", fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  matchCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  matchLeft: { alignItems: "center", justifyContent: "center" },
  circleWrap: { position: "relative", width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  circleInner: { position: "absolute", flexDirection: "row", alignItems: "flex-end" },
  circleScore: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#7c3aed" },
  circlePercent: { fontSize: 11, color: "#a855f7", fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  aiTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  aiTitleText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  matchDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginBottom: 8 },
  matchTags: { flexDirection: "row", gap: 6 },
  matchTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  matchTagText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  contactCard: { flexDirection: "row", borderRadius: 18, padding: 4, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  contactBtn: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  contactBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  contactDivider: { width: 1 },
  section: { borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#f0eeff" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  bio: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillPill: { backgroundColor: "#ede9fe", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  skillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  timelineItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  timelineIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  timelineTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  timelineSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  achieveRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  achieveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7c3aed", marginTop: 6 },
  achieveText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 12, borderTopWidth: 1, shadowColor: "#1e1b4b", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
  shortlistBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#f8f7ff", borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: "#e5e0f8" },
  shortlistBtnActive: { backgroundColor: "#f0eeff", borderColor: "#7c3aed" },
  shortlistText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#8b7dc0" },
  hireBtn: { flex: 1.5, borderRadius: 14, overflow: "hidden" },
  hireGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  hireText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" },
});
