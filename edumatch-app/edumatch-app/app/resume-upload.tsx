import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle,
  ChevronLeft,
  Code2,
  FileUp,
  GraduationCap,
  Lightbulb,
  School,
  Sparkles,
  Upload,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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

type Step = "upload" | "analyzing" | "result";

const EXTRACTED_SKILLS = ["Python", "Machine Learning", "NLP", "TensorFlow", "Deep Learning", "Data Analysis", "Research Methods", "Scikit-learn"];
const EDUCATION = [
  { degree: "PhD Computer Science", uni: "MIT", year: "2019" },
  { degree: "MS Artificial Intelligence", uni: "LUMS", year: "2015" },
];
const EXPERIENCE = [
  { role: "Lecturer", place: "IISAT University", period: "2020–2024" },
  { role: "Research Fellow", place: "Stanford AI Lab", period: "2018–2020" },
];

export default function ResumeUploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("upload");
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (step === "analyzing") {
      Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })).start();
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 18 + 8;
        if (prog >= 100) { prog = 100; clearInterval(interval); setTimeout(() => setStep("result"), 600); }
        setProgress(Math.min(prog, 100));
        Animated.timing(progressAnim, { toValue: prog / 100, duration: 400, useNativeDriver: false }).start();
      }, 500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("analyzing");
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  const TASKS = [
    { label: "Scanning document structure...", done: progress > 20 },
    { label: "Extracting skills & experience...", done: progress > 50 },
    { label: "Running semantic analysis...", done: progress > 75 },
    { label: "Building your profile...", done: progress >= 100 },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color="rgba(196,181,253,0.9)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Resume Upload</Text>
            <Text style={styles.headerSub}>AI-Powered Profile Builder</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.stepsRow}>
          {[{ key: "upload", label: "Upload" }, { key: "analyzing", label: "Analysis" }, { key: "result", label: "Profile" }].map((s, i) => {
            const completed = (s.key === "upload" && (step === "analyzing" || step === "result")) || (s.key === "analyzing" && step === "result");
            const active = s.key === step;
            return (
              <React.Fragment key={s.key}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, (completed || active) && styles.stepCircleDone]}>
                    {completed ? <Check size={12} color="#fff" /> : <Text style={[styles.stepNum, (completed || active) && styles.stepNumDone]}>{i + 1}</Text>}
                  </View>
                  <Text style={[styles.stepLabel, (completed || active) && styles.stepLabelDone]}>{s.label}</Text>
                </View>
                {i < 2 && <View style={[styles.stepLine, (step !== "upload" && i === 0) || (step === "result" && i === 1) ? styles.stepLineDone : {}]} />}
              </React.Fragment>
            );
          })}
        </View>
      </LinearGradient>

      {step === "upload" && (
        <ScrollView contentContainerStyle={[styles.uploadContent, { paddingBottom: bottomInset + 24 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.uploadZone, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <LinearGradient colors={["#f0eeff", "#ede9fe"]} style={styles.uploadIconBg}>
              <Upload size={40} color="#7c3aed" />
            </LinearGradient>
            <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Upload Your Resume</Text>
            <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>Supports PDF and DOCX formats{"\n"}up to 10MB</Text>
            <View style={styles.formatBadges}>
              {["PDF", "DOCX"].map((f) => (
                <View key={f} style={styles.formatBadge}><Text style={styles.formatBadgeText}>{f}</Text></View>
              ))}
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.88 }]} onPress={handleUpload}>
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.uploadBtnGradient}>
              <FileUp size={18} color="#fff" />
              <Text style={styles.uploadBtnText}>Select File</Text>
            </LinearGradient>
          </Pressable>
          <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Lightbulb size={18} color="#f59e0b" />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>AI will extract your skills, education, and experience automatically</Text>
          </View>
        </ScrollView>
      )}

      {step === "analyzing" && (
        <View style={styles.analyzeContent}>
          <View style={styles.analyzeCard}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <LinearGradient colors={["#7c3aed", "#a855f7"]} style={styles.spinnerGradient}>
                <Sparkles size={28} color="#fff" />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.analyzeTitle, { color: colors.foreground }]}>AI is Analyzing...</Text>
            <Text style={[styles.analyzeSub, { color: colors.mutedForeground }]}>Extracting skills, education, and experience from your resume</Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>{Math.round(progress)}% complete</Text>
            {TASKS.map((task) => (
              <View key={task.label} style={styles.taskRow}>
                <View style={[styles.taskDot, task.done && styles.taskDotDone]} />
                <Text style={[styles.taskText, { color: task.done ? "#7c3aed" : colors.mutedForeground }]}>{task.label}</Text>
                {task.done && <CheckCircle size={14} color="#10b981" />}
              </View>
            ))}
          </View>
        </View>
      )}

      {step === "result" && (
        <ScrollView contentContainerStyle={[styles.resultContent, { paddingBottom: bottomInset + 24 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.successBanner, { backgroundColor: "#f0fdf4" }]}>
            <CheckCircle size={22} color="#10b981" />
            <Text style={styles.successText}>Profile extracted successfully!</Text>
          </View>
          <View style={[styles.resultSection, { backgroundColor: colors.card }]}>
            <View style={styles.resultSectionHeader}>
              <Code2 size={16} color="#7c3aed" />
              <Text style={[styles.resultSectionTitle, { color: colors.foreground }]}>Extracted Skills</Text>
              <View style={styles.countBadge}><Text style={styles.countBadgeText}>{EXTRACTED_SKILLS.length}</Text></View>
            </View>
            <View style={styles.skillsWrap}>
              {EXTRACTED_SKILLS.map((s) => <View key={s} style={styles.skillPill}><Text style={styles.skillText}>{s}</Text></View>)}
            </View>
          </View>
          <View style={[styles.resultSection, { backgroundColor: colors.card }]}>
            <View style={styles.resultSectionHeader}>
              <GraduationCap size={16} color="#3b82f6" />
              <Text style={[styles.resultSectionTitle, { color: colors.foreground }]}>Education</Text>
            </View>
            {EDUCATION.map((e) => (
              <View key={e.degree} style={[styles.eduItem, { borderColor: colors.border }]}>
                <View style={[styles.eduIcon, { backgroundColor: "#eff6ff" }]}><School size={16} color="#3b82f6" /></View>
                <View><Text style={[styles.eduDegree, { color: colors.foreground }]}>{e.degree}</Text><Text style={[styles.eduUni, { color: colors.mutedForeground }]}>{e.uni} · {e.year}</Text></View>
              </View>
            ))}
          </View>
          <View style={[styles.resultSection, { backgroundColor: colors.card }]}>
            <View style={styles.resultSectionHeader}>
              <Briefcase size={16} color="#10b981" />
              <Text style={[styles.resultSectionTitle, { color: colors.foreground }]}>Experience</Text>
            </View>
            {EXPERIENCE.map((e) => (
              <View key={e.role} style={[styles.eduItem, { borderColor: colors.border }]}>
                <View style={[styles.eduIcon, { backgroundColor: "#f0fdf4" }]}><Briefcase size={16} color="#10b981" /></View>
                <View><Text style={[styles.eduDegree, { color: colors.foreground }]}>{e.role}</Text><Text style={[styles.eduUni, { color: colors.mutedForeground }]}>{e.place} · {e.period}</Text></View>
              </View>
            ))}
          </View>
          <Pressable style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.88 }]} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); }}>
            <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={styles.confirmGradient}>
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.confirmText}>Confirm & Save Profile</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  headerDecor: { position: "absolute", top: -20, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(124,58,237,0.15)" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
  headerSub: { fontSize: 11, color: "rgba(196,181,253,0.7)", fontFamily: "Inter_400Regular" },
  stepsRow: { flexDirection: "row", alignItems: "center" },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(196,181,253,0.3)" },
  stepCircleDone: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  stepNum: { fontSize: 11, fontFamily: "Inter_700Bold", color: "rgba(196,181,253,0.7)" },
  stepNumDone: { color: "#ffffff" },
  stepLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(196,181,253,0.6)" },
  stepLabelDone: { color: "#c4b5fd" },
  stepLine: { flex: 1, height: 1.5, backgroundColor: "rgba(196,181,253,0.2)", marginBottom: 14 },
  stepLineDone: { backgroundColor: "#7c3aed" },
  uploadContent: { padding: 20, gap: 16 },
  uploadZone: { borderRadius: 20, borderWidth: 2, borderStyle: "dashed", padding: 32, alignItems: "center", gap: 12 },
  uploadIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  uploadTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  uploadSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  formatBadges: { flexDirection: "row", gap: 8, marginTop: 4 },
  formatBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "#f0eeff" },
  formatBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#7c3aed" },
  uploadBtn: { borderRadius: 16, overflow: "hidden" },
  uploadBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17 },
  uploadBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
  tip: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  analyzeContent: { flex: 1, padding: 20, justifyContent: "center" },
  analyzeCard: { borderRadius: 20, backgroundColor: "#ffffff", padding: 28, alignItems: "center", gap: 14, shadowColor: "#1e1b4b", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  spinnerGradient: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  analyzeTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  analyzeSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  progressBar: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#7c3aed", borderRadius: 4 },
  progressText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  taskDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#e5e0f8" },
  taskDotDone: { backgroundColor: "#7c3aed" },
  taskText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  resultContent: { padding: 16, gap: 12 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12 },
  successText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#10b981" },
  resultSection: { borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  resultSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  resultSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  countBadge: { backgroundColor: "#f0eeff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  countBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#7c3aed" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillPill: { backgroundColor: "#ede9fe", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  skillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  eduItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  eduIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eduDegree: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  eduUni: { fontSize: 11, fontFamily: "Inter_400Regular" },
  confirmBtn: { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  confirmGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17 },
  confirmText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
});
