import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Banknote,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Lock,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Tag,
  Globe,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import {
  applyToJobService,
  jobDetailServices,
  applicationStatusService,
} from '@/api/services/jobServices';
import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Recruiter {
  companyName?: string;
  companySize?: string;
  companyWebsite?: string;
  designation?: string;
  industry?: string;
  location?: string;
  phoneNumber?: string;
  professionalBio?: string;
  user?: {
    name: string;
    email: string;
    imageUrl?: string;
  };
}

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  salary: number;
  jobType: string;
  skills: string[];
  description: string;
  jobStatus: string;
  createdAt: string;
  createdBy: Recruiter;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatSalary = (salary: number) =>
  salary >= 1000 ? `PKR ${Math.round(salary / 1000)}k` : `PKR ${salary}`;

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function JobDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Apply & Mock Interview state ──────────────────────────────────────────
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [mockInterviewScore, setMockInterviewScore] = useState<number | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchJob = async () => {
        if (!jobId) return;
        try {
          setLoading(true);
          const res = await jobDetailServices.jobDetail(jobId);
          if (active) setJob(res.data.job);
        } catch (err: any) {
          if (active) setError(err?.message ?? 'Failed to load job details');
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchJob();
      return () => {
        active = false;
      };
    }, [jobId]),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const checkApplicationStatus = async () => {
        if (!jobId) return;
        setCheckingStatus(true);
        try {
          const res = await applicationStatusService.checkStatus(jobId);
          if (active) {
            setApplied(Boolean(res.data?.hasApplied));
            setInterviewCompleted(Boolean(res.data?.hasCompletedMockInterview));
            setMockInterviewScore(res.data?.readinessScore ?? null);
          }
        } catch {
          // silently fail — default stays false
        } finally {
          if (active) setCheckingStatus(false);
        }
      };

      checkApplicationStatus();
      return () => {
        active = false;
      };
    }, [jobId]),
  );

  // ─── Apply handler ─────────────────────────────────────────────────────────
  const handleApply = async () => {
    if (applying || applied) return;

    if (!interviewCompleted) {
      Alert.alert(
        'AI Mock Interview Required',
        'Please complete the AI Mock Interview for this job before submitting your application.',
      );
      return;
    }

    try {
      setApplying(true);
      await applyToJobService.applyToJob(jobId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setApplied(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Failed to apply';
      Alert.alert('Application Failed', message);
    } finally {
      setApplying(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size='large' color='#7c3aed' />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading job details...
        </Text>
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !job) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>{error ?? 'Job not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recruiter = job.createdBy;
  const recruiterName = recruiter?.user?.name ?? 'Recruiter';
  const initials = getInitials(recruiter?.companyName ?? recruiterName);
  const isJobActive = job.jobStatus?.toLowerCase() === 'active';

  // ─── Footer button — what to render based on state ────────────────────────
  const renderFooterButton = () => {
    // While checking status from API — show subtle loader inside button area
    if (checkingStatus) {
      return (
        <View style={styles.checkingBtn}>
          <ActivityIndicator size='small' color='#7c3aed' />
          <Text style={styles.checkingBtnText}>Checking status...</Text>
        </View>
      );
    }

    // Already applied
    if (applied) {
      return (
        <View style={styles.appliedRow}>
          <Sparkles size={18} color='#10b981' />
          <Text style={styles.appliedText}>Application Submitted!</Text>
        </View>
      );
    }

    // Job is closed
    if (!isJobActive) {
      return (
        <View style={styles.closedBtn}>
          <Text style={styles.closedBtnText}>
            This Job Is No Longer Accepting Applications
          </Text>
        </View>
      );
    }

    // Active job, but AI Mock Interview NOT completed yet
    if (!interviewCompleted) {
      return (
        <View style={styles.lockedApplyBox}>
          <View style={styles.lockedNoticeRow}>
            <Lock size={13} color='#9333ea' />
            <Text style={styles.lockedNoticeText}>
              Complete the AI Mock Interview before applying.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.lockedApplyBtn}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                'AI Mock Interview Required',
                'You must complete the AI Mock Interview for this job before submitting your application.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Start Interview',
                    onPress: () =>
                      router.push({
                        pathname: '/mock-interview',
                        params: {
                          jobId: job._id,
                          jobTitle: job.title,
                          department: job.department,
                          location: job.location,
                        },
                      }),
                  },
                ],
              );
            }}
          >
            <View style={styles.lockedApplyBtnInner}>
              <Lock size={15} color='#9ca3af' />
              <Text style={styles.lockedApplyBtnText}>Apply Now</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // Active job AND Mock Interview completed — Apply Now is enabled!
    return (
      <View style={{ gap: 8 }}>
        <View style={styles.interviewDoneBadge}>
          <CheckCircle2 size={14} color='#10b981' />
          <Text style={styles.interviewDoneText}>
            ✓ Mock Interview Completed
            {mockInterviewScore ? ` (${mockInterviewScore}% Readiness)` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.applyBtn, applying && { opacity: 0.7 }]}
          onPress={handleApply}
          disabled={applying}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7c3aed', '#6d28d9']}
            style={styles.applyBtnGrad}
          >
            {applying ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <>
                <Send size={16} color='#fff' />
                <Text style={styles.applyBtnText}>Apply Now</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerDecor} />

        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color='rgba(196,181,253,0.9)' />
        </TouchableOpacity>

        {/* Job title + department */}
        <View style={styles.headerTop}>
          <View style={styles.headerAvatar}>
            {recruiter?.user?.imageUrl ? (
              <Image
                source={{ uri: recruiter.user.imageUrl }}
                style={styles.headerAvatarImg}
              />
            ) : (
              <LinearGradient
                colors={['#7c3aed', '#6d28d9']}
                style={styles.headerAvatarGrad}
              >
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </LinearGradient>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerRole}>{job.title}</Text>
            <Text style={styles.headerDept}>{job.department}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isJobActive
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(220,38,38,0.2)',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isJobActive ? '#10b981' : '#ef4444' },
              ]}
            >
              {job.jobStatus}
            </Text>
          </View>
        </View>

        {/* Pills */}
        <View style={styles.headerPills}>
          <Pill
            icon={<MapPin size={11} color='#c4b5fd' />}
            label={job.location}
          />
          <Pill
            icon={<Briefcase size={11} color='#c4b5fd' />}
            label={job.jobType}
          />
          <Pill
            icon={<Banknote size={11} color='#c4b5fd' />}
            label={formatSalary(job.salary)}
          />
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.body,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Description */}
        <Section
          title='About the Role'
          icon={<BookOpen size={14} color='#7c3aed' />}
        >
          <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
            {job.description || 'No description provided.'}
          </Text>
        </Section>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <Section
            title='Required Skills'
            icon={<Tag size={14} color='#7c3aed' />}
          >
            <View style={styles.skillsWrap}>
              {job.skills.map((s) => (
                <View key={s} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── AI Mock Interview Practice Card ── */}
        {isJobActive && (
          <View style={styles.aiInterviewCard}>
            <LinearGradient
              colors={
                interviewCompleted
                  ? ['#064e3b', '#065f46', '#047857']
                  : ['#1e1b4b', '#2e1065', '#3b0764']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiInterviewGrad}
            >
              <View style={styles.aiInterviewTop}>
                <View
                  style={[
                    styles.aiInterviewIconWrap,
                    interviewCompleted && {
                      backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    },
                  ]}
                >
                  {interviewCompleted ? (
                    <CheckCircle2 size={22} color='#34d399' />
                  ) : (
                    <Bot size={22} color='#c084fc' />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.aiBadgeRow,
                      interviewCompleted && {
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      },
                    ]}
                  >
                    {interviewCompleted ? (
                      <>
                        <CheckCircle2 size={11} color='#34d399' />
                        <Text
                          style={[styles.aiBadgeText, { color: '#34d399' }]}
                        >
                          INTERVIEW COMPLETED
                        </Text>
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} color='#fbbf24' />
                        <Text style={styles.aiBadgeText}>AI INTERVIEW COACH</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.aiInterviewTitle}>
                    {interviewCompleted
                      ? 'AI Mock Interview Completed'
                      : 'Practice AI Mock Interview'}
                  </Text>
                  <Text
                    style={[
                      styles.aiInterviewSub,
                      interviewCompleted && {
                        color: 'rgba(209, 250, 229, 0.9)',
                      },
                    ]}
                  >
                    {interviewCompleted
                      ? `Great job! You are verified with readiness feedback for this role. You can now submit your application or practice again.`
                      : "Answer 5 tailored questions based on your profile & this job's exact requirements. Required before applying!"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.aiStartBtn}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/mock-interview',
                    params: {
                      jobId: job._id,
                      jobTitle: job.title,
                      department: job.department,
                      location: job.location,
                    },
                  })
                }
              >
                <LinearGradient
                  colors={
                    interviewCompleted
                      ? ['#059669', '#10b981']
                      : ['#7c3aed', '#9333ea']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.aiStartBtnGrad}
                >
                  <Text style={styles.aiStartBtnText}>
                    {interviewCompleted
                      ? 'Practice Again'
                      : 'Practice AI Mock Interview'}
                  </Text>
                  <ChevronRight size={16} color='#ffffff' />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Organisation Details */}
        <Section
          title='Organisation Details'
          icon={<Building2 size={14} color='#3b82f6' />}
        >
          <View style={[styles.orgCard, { backgroundColor: colors.card }]}>
            <View style={styles.orgHeader}>
              {recruiter?.user?.imageUrl ? (
                <Image
                  source={{ uri: recruiter.user.imageUrl }}
                  style={styles.orgAvatar}
                />
              ) : (
                <LinearGradient
                  colors={['#7c3aed', '#6d28d9']}
                  style={styles.orgAvatar}
                >
                  <Text style={styles.orgAvatarText}>{initials}</Text>
                </LinearGradient>
              )}
              <View>
                <Text style={[styles.orgName, { color: colors.foreground }]}>
                  {recruiter?.companyName ?? 'Company'}
                </Text>
                <Text
                  style={[styles.orgPerson, { color: colors.mutedForeground }]}
                >
                  Posted by {recruiterName}
                </Text>
              </View>
            </View>

            {recruiter?.industry && (
              <OrgRow
                Icon={GraduationCap}
                label='Industry'
                value={recruiter.industry}
                colors={colors}
              />
            )}
            {recruiter?.companySize && (
              <OrgRow
                Icon={Briefcase}
                label='Company Size'
                value={`${recruiter.companySize} employees`}
                colors={colors}
              />
            )}
            {recruiter?.location && (
              <OrgRow
                Icon={MapPin}
                label='Location'
                value={recruiter.location}
                colors={colors}
              />
            )}
            {recruiter?.companyWebsite && (
              <OrgRow
                Icon={Globe}
                label='Website'
                value={recruiter.companyWebsite}
                colors={colors}
                isLink
              />
            )}
            {recruiter?.phoneNumber && (
              <OrgRow
                Icon={Phone}
                label='Phone'
                value={recruiter.phoneNumber}
                colors={colors}
              />
            )}

            {recruiter?.professionalBio && (
              <View style={[styles.orgBio, { borderTopColor: colors.border }]}>
                <Text
                  style={[
                    styles.orgBioLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  ABOUT
                </Text>
                <Text
                  style={[styles.orgBioText, { color: colors.mutedForeground }]}
                >
                  {recruiter.professionalBio}
                </Text>
              </View>
            )}
          </View>
        </Section>

        {/* Posted date */}
        <View
          style={[
            styles.dateCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Clock size={15} color='#7c3aed' />
          <View>
            <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
              Posted On
            </Text>
            <Text style={[styles.dateValue, { color: colors.foreground }]}>
              {new Date(job.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Apply Footer ── */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomInset + 12,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {renderFooterButton()}
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.pill}>
      {icon}
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIconBox}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function OrgRow({
  Icon,
  label,
  value,
  colors,
  isLink,
}: {
  Icon: any;
  label: string;
  value: string;
  colors: any;
  isLink?: boolean;
}) {
  return (
    <View style={[styles.orgRow, { borderTopColor: colors.border }]}>
      <View style={[styles.orgRowIcon, { backgroundColor: '#f0eeff' }]}>
        <Icon size={14} color='#7c3aed' />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.orgRowLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text
          style={[
            styles.orgRowValue,
            { color: isLink ? '#7c3aed' : colors.foreground },
          ]}
        >
          {value}
        </Text>
      </View>
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
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  headerDecor: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  headerAvatar: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden' },
  headerAvatarImg: { width: 54, height: 54, borderRadius: 16 },
  headerAvatarGrad: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  headerRole: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 3,
  },
  headerDept: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.9)',
    fontFamily: 'Inter_500Medium',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  headerPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(196,181,253,0.9)',
  },
  body: { padding: 20 },
  bodyText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  section: { marginBottom: 24 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#f0eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1e1b4b' },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillTagText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
  },
  orgCard: { borderRadius: 16, padding: 16 },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  orgAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orgAvatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  orgName: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  orgPerson: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  orgRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgRowLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  orgRowValue: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  orgBio: { paddingTop: 12, marginTop: 4, borderTopWidth: 1 },
  orgBioLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  orgBioText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  dateLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  dateValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  applyBtn: { borderRadius: 14, overflow: 'hidden' },
  applyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  applyBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    paddingVertical: 14,
  },
  appliedText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#10b981',
  },
  closedBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#9ca3af',
  },
  // ── New styles ──
  checkingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  checkingBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#7c3aed',
  },
  // ── AI Mock Interview Card Styles ──
  aiInterviewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#2e1065',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  aiInterviewGrad: {
    padding: 18,
  },
  aiInterviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  aiInterviewIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  aiBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  aiInterviewTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  aiInterviewSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(216, 180, 254, 0.85)',
    lineHeight: 17,
  },
  aiStartBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  aiStartBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  aiStartBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  // ── Locked & Completed Apply Button Styles ──
  lockedApplyBox: {
    gap: 8,
  },
  lockedNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  lockedNoticeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
    textAlign: 'center',
  },
  lockedApplyBtn: {
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  lockedApplyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  lockedApplyBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#9ca3af',
  },
  interviewDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  interviewDoneText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#15803d',
  },
});