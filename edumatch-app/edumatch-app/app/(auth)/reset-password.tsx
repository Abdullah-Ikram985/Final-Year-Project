import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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

function checkStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["#ef4444", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const strength = useMemo(() => checkStrength(password), [password]);
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const handleSubmit = async () => {
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (strength < 2) { setError("Please choose a stronger password"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 900);
  };

  if (done) {
    return (
      <View style={[styles.root, { backgroundColor: "#f8f7ff" }]}>
        <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.doneHeader, { paddingTop: topInset + 40 }]}>
          <View style={styles.doneIcon}>
            <LinearGradient colors={["#10b981", "#059669"]} style={styles.doneIconGrad}>
              <CheckCircle size={48} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.doneTitle}>Password Reset!</Text>
          <Text style={styles.doneDesc}>Your password has been successfully reset.{"\n"}You can now sign in with your new password.</Text>
        </LinearGradient>
        <View style={[styles.doneBody, { paddingBottom: bottomInset + 24 }]}>
          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }]} onPress={() => router.dismissAll()}>
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.submitGradient}>
              <Text style={styles.submitText}>Continue to Sign In</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <LinearGradient colors={["#1e1b4b", "#2e1a6e"]} style={[styles.header, { paddingTop: topInset + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="rgba(196,181,253,0.8)" />
        </TouchableOpacity>
        <View style={styles.headerLogo}>
          <LinearGradient colors={["#7c3aed", "#a855f7"]} style={styles.logoGradient}>
            <ShieldCheck size={24} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>Create New Password</Text>
        <Text style={styles.headerSubtitle}>
          {params.email ? `For ${params.email}` : "Choose a strong password to secure your account"}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: bottomInset + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color="#8b7dc0" style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor="#c4b5fd" value={password} onChangeText={setPassword} secureTextEntry={!showPw} autoFocus />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                {showPw ? <EyeOff size={18} color="#8b7dc0" /> : <Eye size={18} color="#8b7dc0" />}
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength ? STRENGTH_COLORS[strength] : "#e5e0f8" }]} />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>{STRENGTH_LABELS[strength]}</Text>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={[styles.inputWrap, confirm.length > 0 && password !== confirm && styles.inputWrapError]}>
              <Lock size={18} color="#8b7dc0" style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor="#c4b5fd" value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm} />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                {showConfirm ? <EyeOff size={18} color="#8b7dc0" /> : <Eye size={18} color="#8b7dc0" />}
              </TouchableOpacity>
            </View>
            {confirm.length > 0 && password !== confirm && (
              <Text style={styles.matchError}>Passwords don't match</Text>
            )}
            {confirm.length > 0 && password === confirm && (
              <View style={styles.matchOk}>
                <CheckCircle size={12} color="#10b981" />
                <Text style={styles.matchOkText}>Passwords match</Text>
              </View>
            )}
          </View>

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password requirements</Text>
            <Requirement met={checks.length} text="At least 8 characters" />
            <Requirement met={checks.upper} text="One uppercase letter" />
            <Requirement met={checks.number} text="One number" />
            <Requirement met={checks.special} text="One special character (!@#$...)" />
          </View>

          {error !== "" && (
            <View style={styles.errorBox}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }]} onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={["#7c3aed", "#6d28d9"]} style={styles.submitGradient}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Reset Password</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.reqRow}>
      <View style={[styles.reqDot, met && styles.reqDotMet]}>
        {met && <Check size={10} color="#fff" />}
      </View>
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f7ff" },
  header: { paddingHorizontal: 24, paddingBottom: 32, alignItems: "flex-start" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  headerLogo: { marginBottom: 16 },
  logoGradient: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#7c3aed", shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: "rgba(196,181,253,0.85)", fontFamily: "Inter_400Regular", lineHeight: 20 },
  body: { flex: 1 },
  bodyContent: { padding: 24 },
  form: { gap: 18 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4c1d95", textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderWidth: 1.5, borderColor: "#e5e0f8", borderRadius: 14, paddingHorizontal: 14, height: 52 },
  inputWrapError: { borderColor: "#fca5a5" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#1e1b4b" },
  eyeBtn: { padding: 4 },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  matchError: { fontSize: 12, color: "#ef4444", fontFamily: "Inter_500Medium", marginTop: 4 },
  matchOk: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  matchOkText: { fontSize: 12, color: "#10b981", fontFamily: "Inter_600SemiBold" },
  requirements: { backgroundColor: "#ffffff", borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: "#e5e0f8" },
  requirementsTitle: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#4c1d95", marginBottom: 4 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reqDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#f0eeff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e5e0f8" },
  reqDotMet: { backgroundColor: "#10b981", borderColor: "#10b981" },
  reqText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#8b7dc0" },
  reqTextMet: { color: "#1e1b4b" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { fontSize: 13, color: "#ef4444", fontFamily: "Inter_400Regular", flex: 1 },
  submitBtn: { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  submitGradient: { paddingVertical: 17, alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
  doneHeader: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "flex-start" },
  doneIcon: { marginBottom: 24 },
  doneIconGrad: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", shadowColor: "#10b981", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  doneTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 12 },
  doneDesc: { fontSize: 14, color: "rgba(196,181,253,0.85)", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  doneBody: { padding: 24, backgroundColor: "#f8f7ff" },
});
