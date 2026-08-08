import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  KeyRound,
  Mail,
  RefreshCw,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();

  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);

      if (!res || res.status !== 'success') {
        setError(res?.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      setLoading(false);
      setSent(true);
    } catch (error: any) {
      setLoading(false);
      const message =
        error?.response?.data?.message || // axios error
        error?.message || // generic error
        'Something went wrong';
      setError(message); // ✅ show in UI instead of Alert
    }
  };
  const handleResend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSent(false);
    setTimeout(() => setSent(true), 600);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 20 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color='rgba(196,181,253,0.8)' />
        </TouchableOpacity>
        <View style={styles.headerLogo}>
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            style={styles.logoGradient}
          >
            <KeyRound size={24} color='#fff' />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>Forgot Password?</Text>
        <Text style={styles.headerSubtitle}>
          {sent ? '' : "No worries, we'll send you reset instructions"}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: bottomInset + 24 },
        ]}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {!sent ? (
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Mail size={18} color='#8b7dc0' style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder='you@university.edu'
                  placeholderTextColor='#c4b5fd'
                  value={email}
                  onChangeText={setEmail}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              <Text style={styles.fieldHint}>
                Enter the email associated with your account
              </Text>
            </View>

            {error !== '' && (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color='#ef4444' />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.88 },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={['#7c3aed', '#6d28d9']}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color='#fff' size='small' />
                ) : (
                  <>
                    <Text style={styles.submitText}>Send Reset Link</Text>
                    <ArrowRight size={18} color='#fff' />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.helperRow}>
              <Text style={styles.helperText}>Remember your password?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.helperLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.successIconGrad}
              >
                <CheckCircle size={40} color='#fff' />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Request Received!</Text>
            <Text style={styles.successDesc}>
              We received your password reset request for{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
              {'\n\n'}You can now set a new password.
            </Text>

            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>What's next?</Text>
              <View style={styles.tipRow}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>1</Text>
                </View>
                <Text style={styles.tipText}>
                  We verified your account successfully
                </Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>2</Text>
                </View>
                <Text style={styles.tipText}>
                  A secure reset token has been assigned to your account
                </Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>3</Text>
                </View>
                <Text style={styles.tipText}>
                  Tap below to create your new password
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.88 },
              ]}
              onPress={() => router.push('/(auth)/reset-password')}
            >
              <LinearGradient
                colors={['#7c3aed', '#6d28d9']}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>Reset My Password</Text>
                {/* <ArrowRight size={18} color='#fff' /> */}
              </LinearGradient>
            </Pressable>

            <View style={styles.helperRow}>
              <Text style={styles.helperText}>Back to</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.helperLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f7ff' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  headerLogo: { marginBottom: 16 },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(196,181,253,0.85)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  body: { flex: 1 },
  bodyContent: { padding: 24 },
  form: { gap: 18 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4c1d95',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e0f8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1e1b4b',
  },
  fieldHint: {
    fontSize: 12,
    color: '#8b7dc0',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  submitText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    paddingHorizontal: 12,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#8b7dc0',
    fontFamily: 'Inter_400Regular',
  },
  helperLink: { fontSize: 13, color: '#7c3aed', fontFamily: 'Inter_700Bold' },
  successWrap: { alignItems: 'center', gap: 16, paddingTop: 8 },
  successIcon: { marginBottom: 4 },
  successIconGrad: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#1e1b4b' },
  successDesc: {
    fontSize: 14,
    color: '#6b6b8d',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  successEmail: { color: '#7c3aed', fontFamily: 'Inter_700Bold' },
  tipsCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e0f8',
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#1e1b4b',
    marginBottom: 4,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#4c1d95',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 13,
    color: '#7c3aed',
    fontFamily: 'Inter_600SemiBold',
  },
});
