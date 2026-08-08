import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Banknote,
  Briefcase,
  Building2,
  CheckCircle,
  ChevronLeft,
  Clock,
  FileText,
  MapPin,
  Plus,
  Sparkles,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Visiting"];
const SUGGESTED_SKILLS = ["Python", "Machine Learning", "TensorFlow", "PyTorch", "NLP", "Deep Learning", "Research", "Data Science"];

export default function PostJobScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [loc, setLoc] = useState("");
  const [salary, setSalary] = useState("");
  const [type, setType] = useState("Full-time");
  const [desc, setDesc] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const addSkill = (s?: string) => {
    const skill = (s ?? newSkill).trim();
    if (skill && !skills.includes(skill)) setSkills([...skills, skill]);
    setNewSkill("");
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const handlePost = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const isValid = title.trim() && dept.trim() && loc.trim();

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color="rgba(196,181,253,0.9)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Post New Job</Text>
            <Text style={styles.headerSub}>Reach the best faculty candidates</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.aiBanner}>
          <Sparkles size={14} color="#a855f7" />
          <Text style={styles.aiBannerText}>AI will auto-match candidates as soon as you post</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionCard title="Job Details" Icon={Briefcase} colors={colors}>
          <Field label="Job Title *" value={title} onChangeText={setTitle} placeholder="e.g. Assistant Professor – CS" colors={colors} />
          <Field label="Department *" value={dept} onChangeText={setDept} placeholder="e.g. Computer Science" colors={colors} Icon={Building2} />
          <Field label="Location *" value={loc} onChangeText={setLoc} placeholder="e.g. Stanford, CA or Remote" colors={colors} Icon={MapPin} last />
        </SectionCard>

        <SectionCard title="Compensation & Type" Icon={Banknote} colors={colors}>
          <Field label="Salary Range" value={salary} onChangeText={setSalary} placeholder="$120k – $160k" colors={colors} Icon={Banknote} />
          <View style={styles.typeWrap}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Job Type</Text>
            <View style={styles.typeRow}>
              {JOB_TYPES.map((t) => (
                <Pressable key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                  <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Required Skills" Icon={Sparkles} colors={colors}>
          {skills.length > 0 && (
            <View style={styles.skillsWrap}>
              {skills.map((s) => (
                <View key={s} style={styles.skillPill}>
                  <Text style={styles.skillText}>{s}</Text>
                  <TouchableOpacity onPress={() => removeSkill(s)}><X size={12} color="#7c3aed" /></TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addSkillRow}>
            <TextInput style={[styles.addSkillInput, { borderColor: colors.border, color: colors.foreground }]} placeholder="Add a skill..." placeholderTextColor={colors.mutedForeground} value={newSkill} onChangeText={setNewSkill} onSubmitEditing={() => addSkill()} returnKeyType="done" />
            <TouchableOpacity onPress={() => addSkill()} style={styles.addSkillBtn}>
              <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.addSkillBtnGrad}>
                <Plus size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={[styles.suggestedLabel, { color: colors.mutedForeground }]}>SUGGESTED</Text>
          <View style={styles.skillsWrap}>
            {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 6).map((s) => (
              <Pressable key={s} style={styles.suggestPill} onPress={() => addSkill(s)}>
                <Plus size={11} color="#8b7dc0" />
                <Text style={styles.suggestText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Job Description" Icon={FileText} colors={colors}>
          <TextInput style={[styles.descInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]} multiline numberOfLines={6} value={desc} onChangeText={setDesc} placeholder="Describe the role, responsibilities, and requirements..." placeholderTextColor={colors.mutedForeground} textAlignVertical="top" />
          <Text style={[styles.descHint, { color: colors.mutedForeground }]}>{desc.length} characters · A clear description gets 3× more applications</Text>
        </SectionCard>

        <View style={styles.actionsRow}>
          <Pressable style={({ pressed }) => [styles.draftBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.85 }]} onPress={() => router.back()}>
            <Clock size={16} color="#7c3aed" />
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.postBtn, !isValid && { opacity: 0.5 }, pressed && isValid && { opacity: 0.88 }]} onPress={handlePost} disabled={!isValid}>
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.postBtnGrad}>
              <CheckCircle size={16} color="#fff" />
              <Text style={styles.postBtnText}>Post Job</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionCard({ title, Icon, children, colors }: { title: string; Icon: any; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}><Icon size={16} color="#7c3aed" /></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, Icon, last }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string; colors: any; Icon?: any; last?: boolean }) {
  return (
    <View style={[styles.fieldGroup, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.fieldInputRow}>
        {Icon && <Icon size={15} color={colors.mutedForeground} style={{ marginRight: 8 }} />}
        <TextInput style={[styles.fieldInput, { color: colors.foreground }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 18, overflow: "hidden" },
  headerDecor: { position: "absolute", top: -20, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(124,58,237,0.15)" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
  headerSub: { fontSize: 11, color: "rgba(196,181,253,0.7)", fontFamily: "Inter_400Regular" },
  aiBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(168,85,247,0.18)", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "rgba(168,85,247,0.25)" },
  aiBannerText: { fontSize: 11, color: "#c4b5fd", fontFamily: "Inter_500Medium", flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionCard: { borderRadius: 18, padding: 16, shadowColor: "#1e1b4b", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#f0eeff" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  fieldGroup: { paddingVertical: 12 },
  fieldLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  fieldInputRow: { flexDirection: "row", alignItems: "center" },
  fieldInput: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  typeWrap: { paddingVertical: 12 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f0eeff", borderWidth: 1, borderColor: "#e5e0f8" },
  typeChipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  typeChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  typeChipTextActive: { color: "#ffffff" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  skillPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ede9fe", paddingLeft: 12, paddingRight: 8, paddingVertical: 6, borderRadius: 20 },
  skillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
  addSkillRow: { flexDirection: "row", gap: 8 },
  addSkillInput: { flex: 1, height: 40, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, fontSize: 13, fontFamily: "Inter_400Regular" },
  addSkillBtn: { borderRadius: 12, overflow: "hidden" },
  addSkillBtnGrad: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  suggestedLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.6, marginTop: 14, marginBottom: 8 },
  suggestPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f8f7ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e0f8" },
  suggestText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#8b7dc0" },
  descInput: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 13, fontFamily: "Inter_400Regular", minHeight: 130 },
  descHint: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 6 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  draftBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, paddingVertical: 15, borderWidth: 1.5 },
  draftBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#7c3aed" },
  postBtn: { flex: 1.5, borderRadius: 14, overflow: "hidden" },
  postBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 15 },
  postBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" },
});
