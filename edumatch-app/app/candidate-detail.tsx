import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { candidateViewServices } from '@/api/services/candidateServices';
import {
  Bookmark,
  Bot,
  Briefcase,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Code2,
  FileText,
  GraduationCap,
  MapPin,
  School,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react-native';

import React, { useState, useCallback } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import {
  jobApplicantsService,
  updateApplicantStatusService,
} from '@/api/services/jobServices';
import {
  mockInterviewService,
  RecruiterInterviewReport,
} from '@/api/services/mockInterviewService';
import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CandidateDetail {
  _id: string;
  title?: string;
  location?: string;
  skills?: string[];
  experience?: { title: string; company: string; duration: string }[];
  education?: { degree: string; institution: string; year: string }[];
  pdfUrl?: string;
  professionalBio?: string;
  linkedinProfileLink?: string;
  phoneNumber?: string;
  user?: { name: string; email: string; imageUrl?: string };
}

interface ApplicantEntry {
  _id: string;
  status: string;
  appliedAt: string;
  candidate: CandidateDetail;
  matchPercent?: number;
  matchLabel?: string;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const AVATAR_COLORS = [
  '#7c3aed',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#dc2626',
  '#db2777',
];
const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CandidateDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { candidateId, jobId } = useLocalSearchParams<{
    candidateId: string;
    jobId: string;
  }>();

  const [applicant, setApplicant] = useState<ApplicantEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiring, setHiring] = useState(false);
  const [interviewReport, setInterviewReport] =
    useState<RecruiterInterviewReport | null>(null);
  const [loadingInterview, setLoadingInterview] = useState(true);
  const [expandedAnswers, setExpandedAnswers] = useState<
    Record<string, boolean>
  >({});

  // ─── Fetch on every screen focus ───────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchCandidate = async () => {
        setLoading(true);
        setError(null);
        if (!jobId || !candidateId) {
          setError('Missing candidate or job information');
          setLoading(false);
          return;
        }
        try {
          const res = await jobApplicantsService.getApplicants(jobId);
          const all: ApplicantEntry[] = res.data.applicants ?? [];
          const found = all.find((a) => a.candidate._id === candidateId);
          if (found) {
            if (active) setApplicant(found);
          } else {
            if (active) setError('Candidate not found');
          }
        } catch (e: any) {
          if (active)
            setError(e?.response?.data?.message || 'Failed to load candidate');
        } finally {
          if (active) setLoading(false);
        }
      };

      const fetchInterviewReport = async () => {
        if (!jobId || !candidateId) return;
        setLoadingInterview(true);
        try {
          const res =
            await mockInterviewService.getRecruiterCandidateInterview(
              candidateId,
              jobId,
            );
          if (active && res.data) {
            setInterviewReport(res.data);
          }
        } catch (e) {
          // silently fail — interview report stays null
        } finally {
          if (active) setLoadingInterview(false);
        }
      };

      fetchCandidate();
      fetchInterviewReport();

      // Fire-and-forget view increment — don't block or fail the screen
      if (candidateId) {
        candidateViewServices
          .incrementProfileView(candidateId)
          .catch((e) =>
            console.error('Failed to log profile view:', e?.message),
          );
      }

      return () => {
        active = false;
      };
    }, [candidateId, jobId]),
  );

  // ─── Hire handler ─────────────────────────────────────────────────────────
  const handleHire = () => {
    if (!applicant || hiring) return;
    const name = applicant.candidate?.user?.name ?? 'this candidate';

    Alert.alert(
      'Hire Candidate',
      `Are you sure you want to hire ${name}? This will notify them of the decision.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hire',
          onPress: async () => {
            setHiring(true);
            try {
              await updateApplicantStatusService.updateStatus(
                jobId,
                applicant.candidate._id,
                'hired',
              );
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setApplicant((prev) =>
                prev ? { ...prev, status: 'hired' } : prev,
              );
            } catch (e: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                'Error',
                e?.response?.data?.message || 'Failed to hire candidate',
              );
            } finally {
              setHiring(false);
            }
          },
        },
      ],
    );
  };

  // ─── Resume handler ───────────────────────────────────────────────────────
  const handleOpenResume = () => {
    const pdfUrl = applicant?.candidate?.pdfUrl;
    if (!pdfUrl) return;

    Alert.alert(
      'Open Resume',
      `This will open ${applicant?.candidate?.user?.name ?? 'the candidate'}'s resume in your browser.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(pdfUrl);
              if (supported) {
                await Linking.openURL(pdfUrl);
              } else {
                Alert.alert('Error', 'Cannot open this URL');
              }
            } catch {
              Alert.alert('Error', 'Failed to open resume');
            }
          },
        },
      ],
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size='large' color='#7c3aed' />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading candidate...
        </Text>
      </View>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error || !applicant) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>{error ?? 'Candidate not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const candidate = applicant.candidate;
  const name = candidate?.user?.name ?? 'Unknown';
  const avatarColor = getAvatarColor(candidate._id);
  const initials = getInitials(name);
  const matchScore = applicant.matchPercent ?? 0;
  const isHired = applicant.status === 'hired';
  const circumference = 2 * Math.PI * 28;
  const dashoffset = circumference - (matchScore / 100) * circumference;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color='rgba(196,181,253,0.9)' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Candidate Profile</Text>

          {/* Bookmark icon — top right — shortlist toggle */}
          <TouchableOpacity
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Toggle between shortlisted and pending via API
              const newStatus =
                applicant.status === 'shortlisted' ? 'pending' : 'shortlisted';
              try {
                await updateApplicantStatusService.updateStatus(
                  jobId,
                  candidate._id,
                  newStatus,
                );
                setApplicant((prev) =>
                  prev ? { ...prev, status: newStatus } : prev,
                );
              } catch {
                Alert.alert('Error', 'Failed to update shortlist status');
              }
            }}
            style={styles.bookmarkBtn}
          >
            <Bookmark
              size={20}
              color={
                applicant.status === 'shortlisted'
                  ? '#a855f7'
                  : 'rgba(196,181,253,0.9)'
              }
              fill={applicant.status === 'shortlisted' ? '#a855f7' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* Avatar + name */}
        <View style={styles.profileTop}>
          {candidate?.user?.imageUrl ? (
            <Image
              source={{ uri: candidate.user.imageUrl }}
              style={styles.avatarImg}
            />
          ) : (
            <View
              style={[styles.avatar, { backgroundColor: avatarColor + '30' }]}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{candidate?.title ?? 'Candidate'}</Text>

          {/* Hired badge in header */}
          {isHired && (
            <View style={styles.hiredHeaderBadge}>
              <CheckCircle size={12} color='#10b981' />
              <Text style={styles.hiredHeaderBadgeText}>Hired</Text>
            </View>
          )}

          {candidate?.location && (
            <View style={styles.locRow}>
              <MapPin size={11} color='rgba(196,181,253,0.7)' />
              <Text style={styles.locText}>{candidate.location}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Match score card */}
        <View style={[styles.matchCard, { backgroundColor: colors.card }]}>
          <View style={styles.matchLeft}>
            <View style={styles.circleWrap}>
              <Svg
                width='64'
                height='64'
                viewBox='0 0 64 64'
                style={{ transform: [{ rotate: '-90deg' }] }}
              >
                <Circle
                  cx='32'
                  cy='32'
                  r='28'
                  fill='none'
                  stroke='#e5e0f8'
                  strokeWidth='5'
                />
                <Circle
                  cx='32'
                  cy='32'
                  r='28'
                  fill='none'
                  stroke='#7c3aed'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                />
              </Svg>
              <View style={styles.circleInner}>
                <Text style={styles.circleScore}>{matchScore}</Text>
                <Text style={styles.circlePercent}>%</Text>
              </View>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.aiTitle}>
              <Sparkles size={14} color='#7c3aed' />
              <Text style={[styles.aiTitleText, { color: colors.foreground }]}>
                AI Match Score
              </Text>
            </View>
            <Text style={[styles.matchDesc, { color: colors.mutedForeground }]}>
              Match calculated based on skills and experience
            </Text>
            <View style={styles.matchTags}>
              {matchScore >= 80 && (
                <View style={[styles.matchTag, { backgroundColor: '#f0fdf4' }]}>
                  <Star size={10} color='#10b981' fill='#10b981' />
                  <Text style={[styles.matchTagText, { color: '#10b981' }]}>
                    Top Match
                  </Text>
                </View>
              )}
              <View style={[styles.matchTag, { backgroundColor: '#f0eeff' }]}>
                <TrendingUp size={10} color='#7c3aed' />
                <Text style={[styles.matchTagText, { color: '#7c3aed' }]}>
                  {applicant.matchLabel ?? 'Good Match'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── AI Mock Interview Report ── */}
        <Section title='AI Mock Interview Report' Icon={Bot} colors={colors}>
          {loadingInterview ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size='small' color='#7c3aed' />
            </View>
          ) : interviewReport?.completed ? (
            <View style={styles.interviewReportBox}>
              {/* Top Banner: Score & Pre-screened Badge */}
              <LinearGradient
                colors={['#1e1b4b', '#2e1065']}
                style={styles.interviewReportHeader}
              >
                <View style={styles.interviewReportScoreRow}>
                  <View>
                    <Text style={styles.interviewReportHeaderLabel}>
                      OVERALL READINESS
                    </Text>
                    <Text style={styles.interviewReportHeaderScore}>
                      {interviewReport.overallReadinessScore}%
                    </Text>
                  </View>
                  <View style={styles.preScreenedBadge}>
                    <CheckCircle2 size={13} color='#34d399' />
                    <Text style={styles.preScreenedBadgeText}>
                      ✓ AI Pre-Screened
                    </Text>
                  </View>
                </View>
                {interviewReport.completedAt && (
                  <Text style={styles.interviewCompletedDate}>
                    Completed on{' '}
                    {new Date(interviewReport.completedAt).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' },
                    )}
                  </Text>
                )}
              </LinearGradient>

              {/* Competency Breakdown Grid */}
              {interviewReport.breakdown && (
                <View style={styles.breakdownGrid}>
                  <View
                    style={[
                      styles.breakdownCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.breakdownValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {interviewReport.breakdown.technicalKnowledge}%
                    </Text>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Technical
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.breakdownCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.breakdownValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {interviewReport.breakdown.communication}%
                    </Text>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Communication
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.breakdownCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.breakdownValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {interviewReport.breakdown.jobRelevance}%
                    </Text>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Relevance
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.breakdownCard,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.breakdownValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {interviewReport.breakdown.answerQuality}%
                    </Text>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Quality
                    </Text>
                  </View>
                </View>
              )}

              {/* Recommendation */}
              {interviewReport.recommendation && (
                <View
                  style={[
                    styles.reportSection,
                    { backgroundColor: '#f0eeff' },
                  ]}
                >
                  <View style={styles.reportSectionHeader}>
                    <Sparkles size={14} color='#7c3aed' />
                    <Text style={styles.reportSectionTitlePurple}>
                      AI Recommendation
                    </Text>
                  </View>
                  <Text style={styles.reportSectionBodyPurple}>
                    {interviewReport.recommendation}
                  </Text>
                </View>
              )}

              {/* Key Strengths */}
              {interviewReport.strengths &&
                interviewReport.strengths.length > 0 && (
                  <View style={styles.reportListBlock}>
                    <Text
                      style={[styles.reportListHeader, { color: '#059669' }]}
                    >
                      Key Strengths
                    </Text>
                    {interviewReport.strengths.map((str, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={styles.bulletGreen}>•</Text>
                        <Text
                          style={[
                            styles.bulletText,
                            { color: colors.foreground },
                          ]}
                        >
                          {str}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

              {/* Areas to Improve */}
              {interviewReport.areasToImprove &&
                interviewReport.areasToImprove.length > 0 && (
                  <View style={styles.reportListBlock}>
                    <Text
                      style={[styles.reportListHeader, { color: '#d97706' }]}
                    >
                      Areas to Explore / Follow Up
                    </Text>
                    {interviewReport.areasToImprove.map((imp, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={styles.bulletAmber}>•</Text>
                        <Text
                          style={[
                            styles.bulletText,
                            { color: colors.foreground },
                          ]}
                        >
                          {imp}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

              {/* 5 Questions & Candidate Answers */}
              {interviewReport.answers &&
                interviewReport.answers.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={[
                        styles.reportListHeader,
                        { color: colors.foreground, marginBottom: 8 },
                      ]}
                    >
                      Interview Questions & Responses (
                      {interviewReport.answers.length})
                    </Text>
                    {interviewReport.answers.map((qa, index) => {
                      const isExpanded =
                        expandedAnswers[qa.questionId || String(index)];
                      return (
                        <View
                          key={qa.questionId || index}
                          style={[
                            styles.qaCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            style={styles.qaHeader}
                            activeOpacity={0.7}
                            onPress={() =>
                              setExpandedAnswers((prev) => ({
                                ...prev,
                                [qa.questionId || String(index)]: !isExpanded,
                              }))
                            }
                          >
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={styles.qaNumber}>
                                Question {index + 1}
                              </Text>
                              <Text
                                style={[
                                  styles.qaQuestion,
                                  { color: colors.foreground },
                                ]}
                                numberOfLines={isExpanded ? undefined : 2}
                              >
                                {qa.question}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                              {qa.score != null && (
                                <View style={styles.qaScoreBadge}>
                                  <Text style={styles.qaScoreText}>
                                    {qa.score}%
                                  </Text>
                                </View>
                              )}
                              {isExpanded ? (
                                <ChevronUp
                                  size={16}
                                  color={colors.mutedForeground}
                                />
                              ) : (
                                <ChevronDown
                                  size={16}
                                  color={colors.mutedForeground}
                                />
                              )}
                            </View>
                          </TouchableOpacity>

                          {isExpanded && (
                            <View
                              style={[
                                styles.qaBody,
                                { borderTopColor: colors.border },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.qaLabel,
                                  { color: colors.mutedForeground },
                                ]}
                              >
                                Candidate Answer:
                              </Text>
                              <Text
                                style={[
                                  styles.qaAnswerText,
                                  { color: colors.foreground },
                                ]}
                              >
                                "{qa.answer}"
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
            </View>
          ) : (
            <View
              style={[
                styles.notCompletedCard,
                { backgroundColor: colors.background },
              ]}
            >
              <Bot size={22} color='#9ca3af' />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.notCompletedTitle,
                    { color: colors.foreground },
                  ]}
                >
                  AI Interview: Not Completed
                </Text>
                <Text
                  style={[
                    styles.notCompletedSub,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Candidate has not yet completed the AI Mock Interview for
                  this job.
                </Text>
              </View>
            </View>
          )}
        </Section>

        {/* Bio */}
        {candidate?.professionalBio && (
          <Section title='About' Icon={FileText} colors={colors}>
            <Text style={[styles.bio, { color: colors.foreground }]}>
              {candidate.professionalBio}
            </Text>
          </Section>
        )}

        {/* Skills */}
        {(candidate?.skills ?? []).length > 0 && (
          <Section title='Skills' Icon={Code2} colors={colors}>
            <View style={styles.skillsWrap}>
              {(candidate.skills ?? []).map((s) => (
                <View key={s} style={styles.skillPill}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Education */}
        {(candidate?.education ?? []).length > 0 && (
          <Section title='Education' Icon={GraduationCap} colors={colors}>
            {(candidate.education ?? []).map((e, i) => (
              <View
                key={`${e.degree}-${i}`}
                style={[
                  styles.timelineItem,
                  i < (candidate.education?.length ?? 0) - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.timelineIcon, { backgroundColor: '#eff6ff' }]}
                >
                  <School size={16} color='#3b82f6' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.timelineTitle, { color: colors.foreground }]}
                  >
                    {e.degree}
                  </Text>
                  <Text
                    style={[
                      styles.timelineSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {e.institution} · {e.year}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Experience */}
        {(candidate?.experience ?? []).length > 0 && (
          <Section title='Experience' Icon={Briefcase} colors={colors}>
            {(candidate.experience ?? []).map((e, i) => (
              <View
                key={`${e.title}-${i}`}
                style={[
                  styles.timelineItem,
                  i < (candidate.experience?.length ?? 0) - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.timelineIcon, { backgroundColor: '#f0fdf4' }]}
                >
                  <Briefcase size={16} color='#10b981' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.timelineTitle, { color: colors.foreground }]}
                  >
                    {e.title}
                  </Text>
                  <Text
                    style={[
                      styles.timelineSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {e.company} · {e.duration}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: bottomInset + 12,
          },
        ]}
      >
        {/* Hire Candidate button */}
        <Pressable
          style={({ pressed }) => [
            styles.hireBtn,
            pressed && !isHired && { opacity: 0.88 },
          ]}
          onPress={handleHire}
          disabled={isHired || hiring}
        >
          {hiring ? (
            <View style={[styles.hireGrad, { backgroundColor: '#7c3aed' }]}>
              <ActivityIndicator size='small' color='#fff' />
              <Text style={styles.hireText}>Hiring...</Text>
            </View>
          ) : isHired ? (
            <View style={[styles.hireGrad, { backgroundColor: '#10b981' }]}>
              <CheckCircle size={16} color='#fff' />
              <Text style={styles.hireText}>Hired ✓</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              style={styles.hireGrad}
            >
              <CheckCircle size={16} color='#fff' />
              <Text style={styles.hireText}>Hire Candidate</Text>
            </LinearGradient>
          )}
        </Pressable>

        {/* View Resume button */}
        {candidate?.pdfUrl ? (
          <Pressable
            style={({ pressed }) => [
              styles.resumeBtn,
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleOpenResume}
          >
            <LinearGradient
              colors={['#1e1b4b', '#2e1a6e']}
              style={styles.resumeGrad}
            >
              <FileText size={16} color='#fff' />
              <Text style={styles.resumeText}>Resume</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.resumeBtn}>
            <View style={[styles.resumeGrad, { backgroundColor: '#e5e0f8' }]}>
              <Text style={[styles.resumeText, { color: '#8b7dc0' }]}>
                No Resume
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────
function Section({
  title,
  Icon,
  children,
  colors,
}: {
  title: string;
  Icon: any;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Icon size={16} color='#7c3aed' />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  errorText: { fontSize: 15, color: '#dc2626', fontFamily: 'Inter_500Medium' },
  retryBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  header: { paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden' },
  headerDecor: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTop: { alignItems: 'center' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff' },
  name: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  role: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.9)',
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  hiredHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  hiredHeaderBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#10b981',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  locText: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.85)',
    fontFamily: 'Inter_500Medium',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  matchLeft: { alignItems: 'center', justifyContent: 'center' },
  circleWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  circleScore: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#7c3aed' },
  circlePercent: {
    fontSize: 11,
    color: '#a855f7',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  aiTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiTitleText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  matchDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
    marginBottom: 8,
  },
  matchTags: { flexDirection: 'row', gap: 6 },
  matchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  matchTagText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  section: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0eeff',
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  bio: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: {
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  timelineSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  // ── Bottom bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  hireBtn: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
  hireGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  hireText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  resumeBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  resumeGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  resumeText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  // ── AI Mock Interview Report Styles ──
  interviewReportBox: {
    gap: 12,
  },
  interviewReportHeader: {
    borderRadius: 14,
    padding: 16,
  },
  interviewReportScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interviewReportHeaderLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(216, 180, 254, 0.9)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  interviewReportHeaderScore: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  preScreenedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  preScreenedBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#34d399',
  },
  interviewCompletedDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(216, 180, 254, 0.7)',
    marginTop: 6,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  breakdownCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  breakdownValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  breakdownLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  reportSection: {
    borderRadius: 12,
    padding: 14,
  },
  reportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reportSectionTitlePurple: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  reportSectionBodyPurple: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#4c1d95',
    lineHeight: 18,
  },
  reportListBlock: {
    gap: 6,
  },
  reportListHeader: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletGreen: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    lineHeight: 18,
  },
  bulletAmber: {
    fontSize: 14,
    color: '#d97706',
    fontWeight: 'bold',
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  qaCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  qaNumber: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
    marginBottom: 2,
  },
  qaQuestion: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
  },
  qaScoreBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qaScoreText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#2563eb',
  },
  qaBody: {
    borderTopWidth: 1,
    padding: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.03)',
  },
  qaLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  qaAnswerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  notCompletedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  notCompletedTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  notCompletedSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 15,
  },
});
