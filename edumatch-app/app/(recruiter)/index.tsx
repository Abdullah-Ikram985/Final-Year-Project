import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  AlertCircle,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
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

import { recruiterDashboardService } from '@/api/services/recruiterService';
import { notificationService } from '@/api/services/jobServices';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────
interface JobBreakdown {
  jobId: string;
  jobTitle: string;
  department: string;
  jobStatus: string;
  totalApplicants: number;
  shortlisted: number;
  hired: number;
}

interface DashboardStats {
  activeJobs: number;
  pendingJobs?: number;
  rejectedJobs?: number;
  totalCandidates: number;
  totalShortlisted: number;
  totalHired: number;
  jobBreakdown: JobBreakdown[];
}

export default function RecruiterDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const sortRecruiterNotifications = (list: any[]) => {
    return [...list].sort((a, b) => {
      // 1. Unread notifications appear first
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;

      // 2. Newest first within each group
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const fetchDashboardData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, notifRes] = await Promise.allSettled([
        recruiterDashboardService.getStats(),
        notificationService.getNotifications(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (notifRes.status === 'fulfilled') {
        const notifData = notifRes.value.data;
        setNotifications(
          sortRecruiterNotifications(notifData.notifications || []),
        );
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err?.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  const handleMarkAsRead = async (id: string, item?: any) => {
    try {
      if (!item?.isRead) {
        await notificationService.markAsRead(id);
        setNotifications((prev) =>
          sortRecruiterNotifications(
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }

    if (item) {
      setNotifModalVisible(false);

      const rawJobId = item.jobId?._id || item.jobId;
      const rawCandidateId =
        item.candidateProfileId?._id || item.candidateProfileId;

      if (item.type === 'application_received') {
        if (rawJobId) {
          router.push({
            pathname: '/(recruiter)/candidates',
            params: {
              jobId: String(rawJobId),
              jobTitle: item.jobId?.title || item.title || undefined,
            },
          });
        } else if (rawCandidateId) {
          router.push({
            pathname: '/candidate-detail',
            params: {
              candidateId: String(rawCandidateId),
              jobId: String(rawJobId || ''),
            },
          });
        } else {
          router.push('/(recruiter)/candidates');
        }
      } else if (item.type === 'job_approved' || item.type === 'job_rejected') {
        router.push('/(recruiter)/my-jobs');
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        sortRecruiterNotifications(prev.map((n) => ({ ...n, isRead: true }))),
      );
      setUnreadCount(0);
    } catch (e) {
      console.warn('Failed to mark all read:', e);
    } finally {
      setNotifLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Active Jobs',
      value: statsLoading ? '...' : String(stats?.activeJobs ?? 0),
      Icon: Briefcase,
      bg: '#f0eeff',
      iconColor: '#7c3aed',
    },
    {
      label: 'Pending Review',
      value: statsLoading ? '...' : String(stats?.pendingJobs ?? 0),
      Icon: Clock,
      bg: '#fffbeb',
      iconColor: '#f59e0b',
    },
    {
      label: 'Candidates',
      value: statsLoading ? '...' : String(stats?.totalCandidates ?? 0),
      Icon: Users,
      bg: '#eff6ff',
      iconColor: '#3b82f6',
    },
    {
      label: 'Shortlisted',
      value: statsLoading ? '...' : String(stats?.totalShortlisted ?? 0),
      Icon: CheckCircle,
      bg: '#f0fdf4',
      iconColor: '#10b981',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSmall}>Welcome back,</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
            <View style={styles.orgRow}>
              <Building2 size={11} color='rgba(196,181,253,0.7)' />
              <Text style={styles.orgText}>
                {user?.organization ??
                  user?.institution ??
                  user?.companyName ??
                  ''}
              </Text>
            </View>
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

        {/* Post Job CTA */}
        <View style={styles.actionCard}>
          <View style={styles.actionLeft}>
            <View style={styles.actionIcon}>
              <Sparkles size={18} color='#a855f7' />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Find your next hire</Text>
              <Text style={styles.actionSub}>
                AI-matched candidates ready for review
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.actionCta}
            onPress={() => router.push('/post-job')}
          >
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              style={styles.actionCtaGrad}
            >
              <Plus size={14} color='#fff' />
              <Text style={styles.actionCtaText}>Post Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats row ── */}
        <View style={styles.statsGrid}>
          {statCards.map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <s.Icon size={18} color={s.iconColor} />
              </View>
              {statsLoading ? (
                <ActivityIndicator
                  size='small'
                  color='#7c3aed'
                  style={{ marginVertical: 4 }}
                />
              ) : (
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {s.value}
                </Text>
              )}
              <Text
                style={[styles.statLabel, { color: colors.mutedForeground }]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            {[
              {
                label: 'Post New Job',
                Icon: Plus,
                color: '#7c3aed',
                bg: '#f0eeff',
                route: '/post-job',
              },
              {
                label: 'All Candidates',
                Icon: Search,
                color: '#3b82f6',
                bg: '#eff6ff',
                route: '/(recruiter)/candidates',
              },
              {
                label: 'View Shortlist',
                Icon: CheckCircle,
                color: '#10b981',
                bg: '#f0fdf4',
                route: '/(recruiter)/candidates',
              },
              {
                label: 'My Jobs',
                Icon: Briefcase,
                color: '#f59e0b',
                bg: '#fffbeb',
                route: '/(recruiter)/my-jobs',
              },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[
                  styles.actionItem,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => router.push(a.route as any)}
              >
                <View
                  style={[styles.actionItemIcon, { backgroundColor: a.bg }]}
                >
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

        {/* ── Active Job Breakdown ── */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Job Postings
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(recruiter)/my-jobs')}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {statsLoading ? (
            <ActivityIndicator
              size='small'
              color='#7c3aed'
              style={{ marginVertical: 20 }}
            />
          ) : !stats?.jobBreakdown || stats.jobBreakdown.length === 0 ? (
            <View style={styles.emptyBreakdown}>
              <Briefcase size={28} color='#c4b5fd' />
              <Text
                style={[
                  styles.emptyBreakdownText,
                  { color: colors.mutedForeground },
                ]}
              >
                No jobs posted yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {stats.jobBreakdown.slice(0, 4).map((job) => {
                const s = (job.jobStatus || '').toLowerCase();
                const isPending = s === 'pending';
                const isRejected = s === 'rejected';
                const isActive = s === 'active';

                const pillBg = isPending
                  ? '#fffbeb'
                  : isRejected
                    ? '#fff1f2'
                    : isActive
                      ? '#f0fdf4'
                      : '#f3f4f6';
                const pillColor = isPending
                  ? '#f59e0b'
                  : isRejected
                    ? '#ef4444'
                    : isActive
                      ? '#10b981'
                      : '#6b7280';

                return (
                  <TouchableOpacity
                    key={job.jobId}
                    style={[
                      styles.jobBreakdownRow,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => router.push('/(recruiter)/my-jobs')}
                  >
                    <View style={styles.jobBreakdownLeft}>
                      <View style={styles.jobBreakdownIcon}>
                        <Briefcase size={16} color='#7c3aed' />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.jobBreakdownTitle,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {job.jobTitle}
                        </Text>
                        <Text
                          style={[
                            styles.jobBreakdownDept,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {job.department}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.jobStatusPill,
                          { backgroundColor: pillBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.jobStatusText,
                            { color: pillColor },
                          ]}
                        >
                          {job.jobStatus || 'Pending'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.jobBreakdownCounts}>
                      <View style={styles.countItem}>
                        <Users size={12} color='#7c3aed' />
                        <Text
                          style={[
                            styles.countValue,
                            { color: colors.foreground },
                          ]}
                        >
                          {job.totalApplicants}
                        </Text>
                        <Text
                          style={[
                            styles.countLabel,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Applicants
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.countDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <View style={styles.countItem}>
                        <CheckCircle size={12} color='#10b981' />
                        <Text
                          style={[
                            styles.countValue,
                            { color: colors.foreground },
                          ]}
                        >
                          {job.shortlisted}
                        </Text>
                        <Text
                          style={[
                            styles.countLabel,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Shortlisted
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Notifications Modal ── */}
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
                  renderItem={({ item, index }) => {
                    const isFirstUnread =
                      !item.isRead &&
                      (index === 0 || notifications[index - 1]?.isRead);
                    const isFirstRead =
                      item.isRead &&
                      (index === 0 || !notifications[index - 1]?.isRead);

                    const isApproved = item.type === 'job_approved';
                    const isRejected = item.type === 'job_rejected';

                    const iconBg = isApproved
                      ? '#f0fdf4'
                      : isRejected
                        ? '#fff1f2'
                        : '#f0eeff';
                    const iconColor = isApproved
                      ? '#10b981'
                      : isRejected
                        ? '#ef4444'
                        : '#7c3aed';
                    const IconComponent = isApproved
                      ? CheckCircle
                      : isRejected
                        ? AlertCircle
                        : Bell;

                    return (
                      <View key={item._id} style={{ gap: 8 }}>
                        {isFirstUnread && (
                          <View style={styles.notifSectionHeader}>
                            <Text
                              style={[
                                styles.notifSectionHeaderText,
                                { color: '#7c3aed' },
                              ]}
                            >
                              UNREAD
                            </Text>
                          </View>
                        )}
                        {isFirstRead && (
                          <View
                            style={[
                              styles.notifSectionHeader,
                              index > 0 && { marginTop: 8 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.notifSectionHeaderText,
                                { color: colors.mutedForeground },
                              ]}
                            >
                              READ / SEEN
                            </Text>
                          </View>
                        )}
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
                      </View>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginVertical: 2,
  },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orgText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(196,181,253,0.7)',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
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
  actionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  actionSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(196,181,253,0.7)',
    marginTop: 1,
  },
  actionCta: { borderRadius: 10, overflow: 'hidden' },
  actionCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionCtaText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  section: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 12, color: '#7c3aed', fontFamily: 'Inter_600SemiBold' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionItem: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  actionItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  jobBreakdownRow: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  jobBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  jobBreakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f0eeff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  jobBreakdownTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  jobBreakdownDept: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  jobStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  jobStatusText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  jobBreakdownCounts: {
    flexDirection: 'row',
    backgroundColor: '#f8f7ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 12,
  },
  countItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  countValue: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  countLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  countDivider: { width: 1, height: 16 },
  emptyBreakdown: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyBreakdownText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  // Notifications Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  markAllBtn: {
    backgroundColor: '#f0eeff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markAllText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#7c3aed' },
  closeBtn: { padding: 4 },
  notifCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  notifItemTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },
  notifItemMessage: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  notifItemTime: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 4 },
  notifEmpty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  notifEmptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  notifSectionHeader: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.12)',
    marginBottom: 4,
  },
  notifSectionHeaderText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
});
