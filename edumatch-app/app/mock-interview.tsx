import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  mockInterviewService,
  InterviewQuestion,
  QuestionFeedback,
  ReadinessBreakdown,
} from '@/api/services/mockInterviewService';
import { useColors } from '@/hooks/useColors';

type InterviewPhase =
  | 'INITIALIZING'
  | 'QUESTION'
  | 'EVALUATING'
  | 'FEEDBACK'
  | 'COMPLETING'
  | 'FINAL_REPORT'
  | 'ERROR';

export default function MockInterviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    jobId: string;
    jobTitle?: string;
    department?: string;
    location?: string;
  }>();

  const jobId = params.jobId;
  const jobTitle = params.jobTitle || 'Academic Role';
  const department = params.department || 'General';

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  // Session state
  const [phase, setPhase] = useState<InterviewPhase>('INITIALIZING');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [latestFeedback, setLatestFeedback] = useState<{
    score: number;
    feedback: QuestionFeedback;
  } | null>(null);
  const [finalReport, setFinalReport] = useState<{
    readinessScore: number;
    breakdown: ReadinessBreakdown;
    strengths: string[];
    areasToImprove: string[];
    recommendation: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize session
  const initSession = async () => {
    if (!jobId) {
      setErrorMessage('Missing Job ID. Please open interview from a valid job.');
      setPhase('ERROR');
      return;
    }

    setPhase('INITIALIZING');
    setErrorMessage(null);
    setCurrentIndex(0);
    setUserAnswer('');
    setLatestFeedback(null);
    setFinalReport(null);

    try {
      const res = await mockInterviewService.startInterview(jobId);
      if (res.success && res.data) {
        setInterviewId(res.data.interviewId);
        setQuestions(res.data.questions || []);
        setPhase('QUESTION');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(res.message || 'Failed to start interview');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not generate interview questions. Please try again.';
      setErrorMessage(msg);
      setPhase('ERROR');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => {
    initSession();
  }, [jobId]);

  // Submit current answer
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !interviewId) return;

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    setPhase('EVALUATING');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await mockInterviewService.submitAnswer(
        interviewId,
        currentQuestion.questionId,
        userAnswer.trim(),
      );

      if (res.success && res.data) {
        setLatestFeedback({
          score: res.data.score,
          feedback: res.data.feedback,
        });
        setPhase('FEEDBACK');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        throw new Error(res.message || 'Evaluation failed');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to evaluate answer. Please try again.';
      Alert.alert('Evaluation Error', msg);
      setPhase('QUESTION');
    }
  };

  // Proceed to next question or complete interview
  const handleProceed = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setLatestFeedback(null);
      setPhase('QUESTION');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      // Last question finished -> Complete interview
      if (!interviewId) return;
      setPhase('COMPLETING');
      try {
        const res = await mockInterviewService.completeInterview(interviewId);
        if (res.success && res.data) {
          setFinalReport({
            readinessScore: res.data.readinessScore,
            breakdown: res.data.breakdown,
            strengths: res.data.strengths || [],
            areasToImprove: res.data.areasToImprove || [],
            recommendation: res.data.recommendation,
          });
          setPhase('FINAL_REPORT');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          throw new Error(res.message || 'Failed to complete interview');
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to compile final report.';
        Alert.alert('Report Error', msg);
        setPhase('FEEDBACK');
      }
    }
  };

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  // ─── Render: INITIALIZING STATE ──────────────────────────────────────────
  if (phase === 'INITIALIZING') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#1e1b4b', '#2e1065', '#3b0764']}
          style={[styles.header, { paddingTop: topInset + 12 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color='#ffffff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Mock Interview</Text>
          <Text style={styles.headerSubtitle}>{jobTitle}</Text>
        </LinearGradient>

        <View style={styles.centerState}>
          <View style={styles.loadingOrb}>
            <Bot size={42} color='#7c3aed' />
          </View>
          <ActivityIndicator size='large' color='#7c3aed' style={{ marginVertical: 16 }} />
          <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
            Generating Tailored Questions...
          </Text>
          <Text style={[styles.loadingSub, { color: colors.mutedForeground }]}>
            AI is analyzing your profile & {jobTitle} requirements to craft 5 realistic interview questions.
          </Text>
        </View>
      </View>
    );
  }

  // ─── Render: ERROR STATE ────────────────────────────────────────────────
  if (phase === 'ERROR') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#1e1b4b', '#2e1065']}
          style={[styles.header, { paddingTop: topInset + 12 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color='#ffffff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Mock Interview</Text>
          <Text style={styles.headerSubtitle}>{jobTitle}</Text>
        </LinearGradient>

        <View style={styles.centerState}>
          <View style={[styles.loadingOrb, { backgroundColor: '#fee2e2' }]}>
            <AlertCircle size={40} color='#ef4444' />
          </View>
          <Text style={[styles.loadingTitle, { color: '#b91c1c', marginTop: 16 }]}>
            Unable to Start Interview
          </Text>
          <Text style={[styles.loadingSub, { color: colors.mutedForeground, marginVertical: 12 }]}>
            {errorMessage || 'An error occurred while setting up the interview.'}
          </Text>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={initSession}>
            <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.primaryActionGrad}>
              <RefreshCw size={16} color='#fff' />
              <Text style={styles.primaryActionText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Render: FINAL REPORT STATE ─────────────────────────────────────────
  if (phase === 'FINAL_REPORT' && finalReport) {
    const scoreColor =
      finalReport.readinessScore >= 80
        ? '#10b981'
        : finalReport.readinessScore >= 60
          ? '#f59e0b'
          : '#ef4444';

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#1e1b4b', '#2e1065', '#3b0764']}
          style={[styles.header, { paddingTop: topInset + 12 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color='#ffffff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interview Readiness Report</Text>
          <Text style={styles.headerSubtitle}>{jobTitle}</Text>
        </LinearGradient>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.reportContainer, { paddingBottom: bottomInset + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Score Hero */}
          <View style={[styles.reportHeroCard, { backgroundColor: colors.card }]}>
            <View style={styles.celebrationBadge}>
              <Award size={18} color='#fbbf24' />
              <Text style={styles.celebrationBadgeText}>SESSION COMPLETE</Text>
            </View>

            <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
              Estimated Interview Readiness
            </Text>

            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {finalReport.readinessScore}%
              </Text>
            </View>

            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              {finalReport.readinessScore >= 80
                ? 'Strong Candidate Fit — Highly Competitive'
                : finalReport.readinessScore >= 60
                  ? 'Moderate Readiness — Review Suggested Areas'
                  : 'Needs Further Domain & Technical Preparation'}
            </Text>
          </View>

          {/* Breakdown Grid */}
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            Competency Breakdown
          </Text>

          <View style={styles.breakdownGrid}>
            {[
              {
                label: 'Technical Depth',
                score: finalReport.breakdown.technicalKnowledge,
                Icon: Brain,
                color: '#7c3aed',
                bg: '#f5f3ff',
              },
              {
                label: 'Communication',
                score: finalReport.breakdown.communication,
                Icon: MessageSquare,
                color: '#3b82f6',
                bg: '#eff6ff',
              },
              {
                label: 'Job Relevance',
                score: finalReport.breakdown.jobRelevance,
                Icon: GraduationCap,
                color: '#10b981',
                bg: '#f0fdf4',
              },
              {
                label: 'Answer Quality',
                score: finalReport.breakdown.answerQuality,
                Icon: TrendingUp,
                color: '#f59e0b',
                bg: '#fffbeb',
              },
            ].map((item) => (
              <View
                key={item.label}
                style={[styles.breakdownCard, { backgroundColor: colors.card }]}
              >
                <View style={[styles.breakdownIconWrap, { backgroundColor: item.bg }]}>
                  <item.Icon size={16} color={item.color} />
                </View>
                <Text style={[styles.breakdownScore, { color: colors.foreground }]}>
                  {item.score}%
                </Text>
                <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {/* AI Recommendation */}
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Sparkles size={16} color='#a855f7' />
              <Text style={styles.recommendationTitle}>AI Hiring Mentor Recommendation</Text>
            </View>
            <Text style={styles.recommendationText}>
              "{finalReport.recommendation}"
            </Text>
          </View>

          {/* Strong Areas */}
          {finalReport.strengths.length > 0 && (
            <View style={[styles.feedbackSectionCard, { backgroundColor: colors.card }]}>
              <View style={styles.feedbackSectionHeader}>
                <CheckCircle2 size={16} color='#10b981' />
                <Text style={[styles.feedbackSectionTitle, { color: colors.foreground }]}>
                  Key Strengths
                </Text>
              </View>
              {finalReport.strengths.map((str, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.greenDot}>✓</Text>
                  <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>
                    {str}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Areas to Improve */}
          {finalReport.areasToImprove.length > 0 && (
            <View style={[styles.feedbackSectionCard, { backgroundColor: colors.card }]}>
              <View style={styles.feedbackSectionHeader}>
                <Lightbulb size={16} color='#f59e0b' />
                <Text style={[styles.feedbackSectionTitle, { color: colors.foreground }]}>
                  Areas for Improvement
                </Text>
              </View>
              {finalReport.areasToImprove.map((imp, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.amberDot}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>
                    {imp}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Bottom Actions */}
          <View style={styles.reportActionRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={initSession}
              activeOpacity={0.8}
            >
              <RotateCcw size={16} color='#7c3aed' />
              <Text style={styles.secondaryBtnText}>Practice Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtnFlex}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#7c3aed', '#6d28d9']}
                style={styles.primaryBtnGrad}
              >
                <Text style={styles.primaryBtnText}>Back to Job</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Render: QUESTION / FEEDBACK STATE ──────────────────────────────────
  const isFeedback = phase === 'FEEDBACK';
  const isEvaluating = phase === 'EVALUATING';
  const isCompleting = phase === 'COMPLETING';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1065', '#3b0764']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color='#ffffff' />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>AI Mock Interview</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {jobTitle} • {department}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressText}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: bottomInset + 30 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
            <View style={styles.questionCardTop}>
              <View style={styles.qTypeBadge}>
                <BookOpen size={11} color='#7c3aed' />
                <Text style={styles.qTypeBadgeText}>
                  {(currentQ?.questionType || 'technical').toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.qNumberTag, { color: colors.mutedForeground }]}>
                #{currentIndex + 1}
              </Text>
            </View>

            <Text style={[styles.questionText, { color: colors.foreground }]}>
              "{currentQ?.question}"
            </Text>
          </View>

          {/* Feedback Card (If evaluated) */}
          {isFeedback && latestFeedback && (
            <View style={styles.feedbackCard}>
              <View style={styles.feedbackTop}>
                <View>
                  <Text style={styles.feedbackTitle}>AI Evaluation</Text>
                  <Text style={styles.feedbackSubtitle}>Response analyzed against job standards</Text>
                </View>
                <View style={styles.feedbackScoreBadge}>
                  <Text style={styles.feedbackScoreNum}>{latestFeedback.score}</Text>
                  <Text style={styles.feedbackScoreTotal}>/100</Text>
                </View>
              </View>

              {/* Strengths */}
              {latestFeedback.feedback.strengths?.length > 0 && (
                <View style={styles.feedbackBulletBlock}>
                  <Text style={styles.feedbackBlockTitleGreen}>What was good:</Text>
                  {latestFeedback.feedback.strengths.map((str, i) => (
                    <Text key={i} style={styles.feedbackBulletItemGreen}>
                      ✓ {str}
                    </Text>
                  ))}
                </View>
              )}

              {/* Improvements */}
              {latestFeedback.feedback.improvements?.length > 0 && (
                <View style={styles.feedbackBulletBlock}>
                  <Text style={styles.feedbackBlockTitleAmber}>To improve:</Text>
                  {latestFeedback.feedback.improvements.map((imp, i) => (
                    <Text key={i} style={styles.feedbackBulletItemAmber}>
                      • {imp}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Answer Input (If not feedback phase) */}
          {!isFeedback && (
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                YOUR ANSWER
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.foreground, borderColor: colors.border },
                ]}
                placeholder='Type your response here. Explain clearly with terminology and examples...'
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={6}
                value={userAnswer}
                onChangeText={setUserAnswer}
                editable={!isEvaluating}
                textAlignVertical='top'
              />
              <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>
                {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </Text>
            </View>
          )}

          {/* Action Button */}
          {isFeedback ? (
            <TouchableOpacity
              style={styles.proceedBtn}
              onPress={handleProceed}
              disabled={isCompleting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#7c3aed', '#6d28d9']}
                style={styles.primaryBtnGrad}
              >
                {isCompleting ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>
                      {currentIndex + 1 < questions.length
                        ? 'Next Question'
                        : 'View Final Readiness Report 🎉'}
                    </Text>
                    <ArrowRight size={17} color='#ffffff' />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.proceedBtn,
                (!userAnswer.trim() || isEvaluating) && { opacity: 0.6 },
              ]}
              onPress={handleSubmitAnswer}
              disabled={!userAnswer.trim() || isEvaluating}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#7c3aed', '#6d28d9']}
                style={styles.primaryBtnGrad}
              >
                {isEvaluating ? (
                  <>
                    <ActivityIndicator size='small' color='#fff' />
                    <Text style={styles.primaryBtnText}>Evaluating with AI...</Text>
                  </>
                ) : (
                  <>
                    <Send size={16} color='#ffffff' />
                    <Text style={styles.primaryBtnText}>Submit Answer</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(216, 180, 254, 0.85)',
    marginTop: 1,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  progressPercentText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#fbbf24',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  questionCard: {
    borderRadius: 18,
    padding: 20,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  questionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qTypeBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
    letterSpacing: 0.5,
  },
  qNumberTag: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  questionText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 24,
  },
  inputContainer: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  textInput: {
    minHeight: 140,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  wordCount: {
    textAlign: 'right',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  feedbackCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  feedbackTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  feedbackTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0f172a',
  },
  feedbackSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    marginTop: 2,
  },
  feedbackScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  feedbackScoreNum: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    color: '#059669',
  },
  feedbackScoreTotal: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#059669',
  },
  feedbackBulletBlock: {
    marginBottom: 12,
  },
  feedbackBlockTitleGreen: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#047857',
    marginBottom: 4,
  },
  feedbackBulletItemGreen: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#065f46',
    lineHeight: 18,
    marginBottom: 3,
  },
  feedbackBlockTitleAmber: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#b45309',
    marginBottom: 4,
  },
  feedbackBulletItemAmber: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#92400e',
    lineHeight: 18,
    marginBottom: 3,
  },
  proceedBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 16,
  },
  primaryActionBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryActionGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },

  // Final Report Styles
  reportContainer: {
    padding: 16,
    gap: 16,
  },
  reportHeroCard: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  celebrationBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#d97706',
    letterSpacing: 0.5,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  scoreCircle: {
    marginVertical: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  breakdownCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  breakdownScore: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    marginBottom: 2,
  },
  breakdownLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  recommendationCard: {
    backgroundColor: '#faf5ff',
    borderLeftWidth: 4,
    borderLeftColor: '#9333ea',
    borderRadius: 14,
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recommendationTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#7e22ce',
  },
  recommendationText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#581c87',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  feedbackSectionCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  greenDot: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#10b981',
  },
  amberDot: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    lineHeight: 16,
  },
  bulletText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    flex: 1,
  },
  reportActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    borderWidth: 1.5,
    borderColor: '#ede9fe',
    borderRadius: 14,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  primaryBtnFlex: {
    flex: 1.2,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
