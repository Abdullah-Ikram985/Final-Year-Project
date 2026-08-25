import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  AlertCircle,
  Bell,
  Bookmark,
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MapPin,
  Pencil,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { savedJobServices } from '@/api/services/candidateServices';
import {
  notificationService,
  recommendedJobs as recommendedJobsService,
} from '@/api/services/jobServices';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  matchPercent: number;
  matchLabel: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (title: string) =>
  title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const AVATAR_COLORS = [
  '#dc2626',
  '#7c3aed',
  '#0369a1',
  '#d97706',
  '#10b981',
  '#db2777',
];

const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);

  const [topJobs, setTopJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const firstName = user?.name?.split(' ').slice(-2).join(' ') ?? 'there';
  const matchScore = user?.matchScore ?? 87;
  const circumference = 2 * Math.PI * 22;
  const dashoffset = circumference - (matchScore / 100) * circumference;

  // ─── Fetch on every screen focus ──────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const fetchAll = async () => {
        // 1. Saved jobs count
        try {
          setSavedJobsLoading(true);
          const res = await savedJobServices.getSavedJobs();
          setSavedJobsCount(res.data?.savedJobsLength ?? 0);
        } catch (error: any) {
          console.error('Failed to fetch saved jobs:', error?.message);
        } finally {
          setSavedJobsLoading(false);
        }

        // 2. Recommended jobs — sort by matchPercent desc, take top 3
        try {
          setJobsLoading(true);
          const res = await recommendedJobsService.candidateRecommendedJobs();
          const sorted = (res.data ?? [])
            .sort((a: Job, b: Job) => b.matchPercent - a.matchPercent)
            .slice(0, 3);
          setTopJobs(sorted);
        } catch (error: any) {
          console.error('Failed to fetch recommended jobs:', error?.message);
        } finally {
          setJobsLoading(false);
        }

        // 3. Notifications
        try {
          const notifRes = await notificationService.getNotifications();
          const notifData = notifRes.data || notifRes;
          setNotifications(notifData.notifications || notifRes.notifications || []);
          setUnreadCount(notifData.unreadCount ?? notifRes.unreadCount ?? 0);
        } catch (error: any) {
          console.warn('Failed to fetch candidate notifications:', error?.message);
        }
      };

      fetchAll();
    }, []),
  );

  const handleMarkAsRead = async (id: string, item?: any) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (item && (item.type?.startsWith('application_') || item.jobId)) {
        setNotifModalVisible(false);
        router.push('/(tabs)/applications');
      }
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Failed to mark all read:', e);
    } finally {
      setNotifLoading(false);
    }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Applications',
      value: String((user as any)?.appliedJobs?.length ?? 0),
      Icon: FileText,
      bg: '#eff6ff',
      iconColor: '#3b82f6',
    },
    {
      label: 'Saved Jobs',
      value: savedJobsLoading ? '...' : String(savedJobsCount),
      Icon: Bookmark,
      bg: '#f0fdf4',
      iconColor: '#10b981',
    },
    {
      label: 'Profile Views',
      value: String((user as any)?.profileView ?? 0),
      Icon: Eye,
      bg: '#fdf4ff',
      iconColor: '#a855f7',
    },
  ];

  // ─── Quick actions ────────────────────────────────────────────────────────
  const quickActions = [
    {
      label: 'Career Roadmap',
      Icon: TrendingUp,
      color: '#7c3aed',
      bg: '#f0eeff',
      route: '/career-roadmap',
    },
    {
      label: 'Upload Resume',
      Icon: Upload,
      color: '#3b82f6',
      bg: '#eff6ff',
      route: '/resume-upload',
    },
    {
      label: 'Edit Profile',
      Icon: Pencil,
      color: '#10b981',
      bg: '#f0fdf4',
      route: '/edit-profile',
    },
    {
      label: 'Browse Jobs',
      Icon: Briefcase,
      color: '#f59e0b',
      bg: '#fffbeb',
      route: '/(tabs)/jobs',
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerDecor} />

        {/* Greeting row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSmall}>Good morning,</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => setNotifModalVisible(true)}
          >
            <Bell size={22} color='rgba(196,181,253,0.9)' />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Match score card */}
        <View style={styles.matchCard}>
          <View style={styles.matchLeft}>
            <View style={styles.circleWrap}>
              <Svg
                width='52'
                height='52'
                viewBox='0 0 52 52'
                style={{ transform: [{ rotate: '-90deg' }] }}
              >
                <Circle
                  cx='26'
                  cy='26'
                  r='22'
                  fill='none'
                  stroke='#e5e0f8'
                  strokeWidth='4'
                />
                <Circle
                  cx='26'
                  cy='26'
                  r='22'
                  fill='none'
                  stroke='#a855f7'
                  strokeWidth='4'
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
          <View style={styles.matchRight}>
            <View style={styles.matchTitleRow}>
              <Sparkles size={13} color='#a855f7' />
              <Text style={styles.matchTitle}>Profile Match Score</Text>
            </View>
            <Text style={styles.matchSub}>
              Upload your latest resume to increase score to 94%
            </Text>
            <TouchableOpacity
              style={styles.matchCta}
              onPress={() => router.push('/resume-upload')}
            >
              <Text style={styles.matchCtaText}>Upload Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <s.Icon size={18} color={s.iconColor} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {s.value}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            {quickActions.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[
                  styles.actionItem,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => router.push(a.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                  <a.Icon size={20} color={a.color} />
                </View>
                <Text
                  style={[styles.actionLabel, { color: colors.foreground }]}
                >
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recommended jobs */}
        <View style={styles.recommendedSection}>
          <View style={styles.recommendedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recommended for You
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Loading state */}
          {jobsLoading ? (
            <View style={styles.jobsLoader}>
              <ActivityIndicator size='small' color='#7c3aed' />
            </View>
          ) : topJobs.length === 0 ? (
            /* Empty state */
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Briefcase size={28} color='#c4b5fd' />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No recommendations yet
              </Text>
              <Text
                style={[styles.emptySubText, { color: colors.mutedForeground }]}
              >
                Complete your profile to get matched
              </Text>
            </View>
          ) : (
            /* Job cards — sorted highest match first */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jobCards}
            >
              {topJobs.map((job) => {
                const avatarColor = getAvatarColor(job._id);
                const initials = getInitials(job.title);

                return (
                  <View
                    key={job._id}
                    style={[styles.jobCard, { backgroundColor: colors.card }]}
                  >
                    <View style={styles.jobTop}>
                      <View
                        style={[
                          styles.jobAvatar,
                          { backgroundColor: avatarColor + '18' },
                        ]}
                      >
                        <Text
                          style={[styles.jobAvatarText, { color: avatarColor }]}
                        >
                          {initials}
                        </Text>
                      </View>
                      <View style={styles.matchBadge}>
                        <Sparkles size={10} color='#10b981' />
                        <Text style={styles.matchBadgeText}>
                          {job.matchPercent.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[styles.jobRole, { color: colors.foreground }]}
                    >
                      {job.title}
                    </Text>
                    <Text
                      style={[
                        styles.jobDept,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {job.department}
                    </Text>

                    <View style={styles.jobLocRow}>
                      <MapPin size={11} color={colors.mutedForeground} />
                      <Text
                        style={[
                          styles.jobLoc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {job.location}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.applyBtn, { backgroundColor: '#1e1b4b' }]}
                      onPress={() => router.push('/(tabs)/jobs')}
                    >
                      <Text style={styles.applyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Candidate Notifications Modal ── */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNotifModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalSheet,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Bell size={20} color='#7c3aed' />
                    <Text
                      style={[styles.modalTitle, { color: colors.foreground }]}
                    >
                      Notifications
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {unreadCount > 0 && (
                      <TouchableOpacity
                        style={styles.markAllBtn}
                        onPress={handleMarkAllRead}
                        disabled={notifLoading}
                      >
                        <Text style={styles.markAllText}>Mark all read</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => setNotifModalVisible(false)}
                      style={styles.closeBtn}
                    >
                      <X size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>

                <FlatList
                  data={notifications}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ padding: 16, gap: 10 }}
                  renderItem={({ item }) => {
                    const isShortlisted = item.type === 'application_shortlisted';
                    const isRejected = item.type === 'application_rejected' || item.type === 'job_rejected';
                    const isReviewed = item.type === 'application_reviewed';
                    const isSubmitted = item.type === 'application_submitted';
                    const isApproved = item.type === 'job_approved';

                    const iconBg = isShortlisted || isApproved
                      ? '#f0fdf4'
                      : isRejected
                        ? '#fff1f2'
                        : isReviewed
                          ? '#eff6ff'
                          : '#f0eeff';
                    const iconColor = isShortlisted || isApproved
                      ? '#10b981'
                      : isRejected
                        ? '#ef4444'
                        : isReviewed
                          ? '#3b82f6'
                          : '#7c3aed';
                    const IconComponent = isShortlisted
                      ? Star
                      : isApproved
                        ? CheckCircle
                        : isRejected
                          ? AlertCircle
                          : isReviewed
                            ? Eye
                            : isSubmitted
                              ? FileText
                              : Bell;

                    return (
                      <TouchableOpacity
                        style={[
                          styles.notifCard,
                          {
                            backgroundColor: item.isRead
                              ? colors.background
                              : '#faf8ff',
                            borderColor: item.isRead
                              ? colors.border
                              : '#c4b5fd',
                          },
                        ]}
                        onPress={() => handleMarkAsRead(item._id, item)}
                      >
                        <View
                          style={[
                            styles.notifIconWrap,
                            { backgroundColor: iconBg },
                          ]}
                        >
                          <IconComponent size={18} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.notifTopRow}>
                            <Text
                              style={[
                                styles.notifItemTitle,
                                { color: colors.foreground },
                              ]}
                            >
                              {item.title}
                            </Text>
                            {!item.isRead && <View style={styles.unreadDot} />}
                          </View>
                          <Text
                            style={[
                              styles.notifItemMessage,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {item.message}
                          </Text>
                          <Text
                            style={[
                              styles.notifItemTime,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )
                              : 'Recent'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.notifEmpty}>
                      <Bell size={36} color='#c4b5fd' />
                      <Text
                        style={[
                          styles.notifEmptyText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        No notifications yet
                      </Text>
                    </View>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  headerDecor: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingSmall: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.8)',
    fontFamily: 'Inter_400Regular',
  },
  greetingName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginTop: 2,
  },
  notifBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#2e1a6e',
  },

  // Match card
  matchCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  matchLeft: { alignItems: 'center', justifyContent: 'center' },
  circleWrap: {
    position: 'relative',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  circleScore: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  circlePercent: {
    fontSize: 9,
    color: '#a855f7',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 1,
  },
  matchRight: { flex: 1 },
  matchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  matchTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  matchSub: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.8)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
    marginBottom: 8,
  },
  matchCta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  matchCtaText: {
    fontSize: 12,
    color: '#a855f7',
    fontFamily: 'Inter_600SemiBold',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },

  // Section card
  section: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 14,
  },

  // Action grid
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionItem: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },

  // Recommended section
  recommendedSection: { marginBottom: 16 },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: '#7c3aed', fontFamily: 'Inter_600SemiBold' },

  // Jobs loader
  jobsLoader: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyCard: {
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },

  // Job cards
  jobCards: { paddingRight: 16, gap: 12 },
  jobCard: {
    width: 220,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  jobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobAvatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  matchBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#10b981',
  },
  jobRole: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  jobDept: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  jobLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 12,
  },
  jobLoc: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  applyBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  applyBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#ffffff' },

  // Notifications Modal
  notifBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.1)',
  },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  markAllText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
  },
  closeBtn: { padding: 4 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifItemTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
    marginLeft: 6,
  },
  notifItemMessage: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginBottom: 4,
  },
  notifItemTime: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  notifEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  notifEmptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
