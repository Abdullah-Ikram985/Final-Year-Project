import {
  updatingJobStatus,
  deleteJob,
  recruiterJobService,
} from '@/api/services/jobServices';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  MoreVertical,
  Plus,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const FILTERS = ['All', 'Active', 'Closed', 'Draft'];

const STATUS_OPTIONS = [
  {
    value: 'Active',
    label: 'Set Active',
    icon: CheckCircle,
    color: '#10b981',
    bg: '#f0fdf4',
  },
  {
    value: 'Closed',
    label: 'Close Job',
    icon: XCircle,
    color: '#6b7280',
    bg: '#f3f4f6',
  },
  {
    value: 'Draft',
    label: 'Move to Draft',
    icon: Clock,
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

const normalizeJob = (job: any) => ({
  id: String(job._id ?? job.id ?? ''),
  title: job.title?.trim() || 'Untitled Job',
  dept: job.department?.trim() || '—',
  loc: job.location?.trim() || '—',
  type: job.jobType ?? '—',
  salary: job.salary ?? null,
  skills: Array.isArray(job.skills) ? job.skills : [],
  posted: job.createdAt
    ? new Date(job.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
  applicants: Array.isArray(job.applicants) ? job.applicants.length : 0,
  views: job.views ?? 0,
  status: (() => {
    const s = (job.jobStatus ?? job.status ?? 'Active').toLowerCase();
    if (s === 'active') return 'Active';
    if (s === 'closed') return 'Closed';
    if (s === 'draft') return 'Draft';
    return 'Active';
  })(),
});

const statusStyle = (status: string) => {
  switch (status) {
    case 'Active':
      return { statusBg: '#f0fdf4', statusColor: '#10b981' };
    case 'Closed':
      return { statusBg: '#f3f4f6', statusColor: '#6b7280' };
    case 'Draft':
      return { statusBg: '#fffbeb', statusColor: '#f59e0b' };
    default:
      return { statusBg: '#f0fdf4', statusColor: '#10b981' };
  }
};

export default function RecruiterJobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuJob, setMenuJob] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const fetchJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await recruiterJobService.getRecruiterJobs();
      const rawJobs = res?.data?.jobs ?? res?.data ?? [];
      setJobs((Array.isArray(rawJobs) ? rawJobs : []).map(normalizeJob));
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || 'Failed to load jobs',
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs]),
  );

  const openMenu = (job: any) => {
    setMenuJob(job);
    Animated.spring(menuAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setMenuJob(null));
  };


  const handleStatusChange = async (jobId: string, newStatus: string) => {
    closeMenu();
    setUpdatingId(jobId);
    try {
      await updatingJobStatus.updateJobStatus(jobId, newStatus);
      await fetchJobs(true); // ← THE FIX: re-fetch instead of local patch
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'Failed to update status',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (job: any) => {
    closeMenu();
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${job.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJob.delete(job.id);
              await fetchJobs(true); // also re-fetch after delete
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.message || 'Failed to delete job',
              );
            }
          },
        },
      ],
    );
  };

  const filtered = jobs.filter((j) => filter === 'All' || j.status === filter);
  const totalApplicants = jobs.reduce((acc, j) => acc + j.applicants, 0);
  const activeCount = jobs.filter((j) => j.status === 'Active').length;

  const menuScale = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const menuOpacity = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

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
            <Text style={styles.headerTitle}>My Job Postings</Text>
            <Text style={styles.headerSub}>Manage your active openings</Text>
          </View>
          <TouchableOpacity
            style={styles.postBtn}
            onPress={() => router.push('/post-job')}
          >
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              style={styles.postBtnGrad}
            >
              <Plus size={16} color='#fff' />
              <Text style={styles.postBtnText}>Post Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          {[
            {
              label: 'Total Posted',
              value: String(jobs.length),
              bg: 'rgba(255,255,255,0.15)',
            },
            {
              label: 'Active',
              value: String(activeCount),
              bg: 'rgba(16,185,129,0.3)',
            },
            {
              label: 'Applicants',
              value: String(totalApplicants),
              bg: 'rgba(124,58,237,0.3)',
            },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.statItem, { backgroundColor: s.bg }]}
            >
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Tabs ── */}
      <View
        style={[
          styles.tabs,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {FILTERS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, filter === t && styles.tabActive]}
            onPress={() => setFilter(t)}
          >
            <Text
              style={[styles.tabText, filter === t && styles.tabTextActive]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size='large' color='#7c3aed' />
          <Text style={[styles.centerText, { color: colors.mutedForeground }]}>
            Loading jobs...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchJobs()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(j) => j.id}
          contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item: job }) => {
            const { statusBg, statusColor } = statusStyle(job.status);
            const isUpdating = updatingId === job.id;
            return (
              <View style={[styles.jobCard, { backgroundColor: colors.card }]}>
                <View style={styles.jobTop}>
                  <View style={styles.jobIcon}>
                    <Briefcase size={20} color='#7c3aed' />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.jobTitle, { color: colors.foreground }]}
                    >
                      {job.title}
                    </Text>
                    <Text
                      style={[
                        styles.jobDept,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {job.dept}
                    </Text>
                  </View>
                  {isUpdating ? (
                    <ActivityIndicator
                      size='small'
                      color='#7c3aed'
                      style={{ padding: 4 }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.moreBtn}
                      onPress={() => openMenu(job)}
                    >
                      <MoreVertical size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.jobMetaRow}>
                  <View style={styles.jobMetaTag}>
                    <MapPin size={11} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.jobMetaText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {job.loc}
                    </Text>
                  </View>
                  <View style={styles.jobMetaTag}>
                    <Calendar size={11} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.jobMetaText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {job.posted}
                    </Text>
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: statusBg }]}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {job.status}
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.jobStats, { borderTopColor: colors.border }]}
                >
                  <View style={styles.jobStatItem}>
                    <Users size={14} color='#7c3aed' />
                    <Text
                      style={[
                        styles.jobStatValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {job.applicants}
                    </Text>
                    <Text
                      style={[
                        styles.jobStatLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Applicants
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.jobStatDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.jobStatItem}>
                    <Eye size={14} color='#3b82f6' />
                    <Text
                      style={[
                        styles.jobStatValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {job.views}
                    </Text>
                    <Text
                      style={[
                        styles.jobStatLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Views
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewCandsBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/(recruiter)/candidates',
                        params: { jobId: job.id, jobTitle: job.title },
                      })
                    }
                  >
                    <Text style={styles.viewCandsText}>View Candidates</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Briefcase size={40} color='#c4b5fd' />
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                {filter === 'All' ? 'No jobs posted yet' : `No ${filter} jobs`}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Context Menu Modal ── */}
      <Modal
        visible={!!menuJob}
        transparent
        animationType='none'
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuSheet,
                  {
                    backgroundColor: colors.card,
                    transform: [{ scale: menuScale }],
                    opacity: menuOpacity,
                  },
                ]}
              >
                <View style={styles.menuHeader}>
                  <View style={styles.menuJobIcon}>
                    <Briefcase size={16} color='#7c3aed' />
                  </View>
                  <Text
                    style={[styles.menuJobTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {menuJob?.title}
                  </Text>
                </View>

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <Text
                  style={[
                    styles.menuSectionLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  CHANGE STATUS
                </Text>
                {STATUS_OPTIONS.filter((s) => s.value !== menuJob?.status).map(
                  (opt) => {
                    const Icon = opt.icon;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={styles.menuItem}
                        onPress={() =>
                          handleStatusChange(menuJob.id, opt.value)
                        }
                      >
                        <View
                          style={[
                            styles.menuItemIcon,
                            { backgroundColor: opt.bg },
                          ]}
                        >
                          <Icon size={16} color={opt.color} />
                        </View>
                        <Text
                          style={[
                            styles.menuItemText,
                            { color: colors.foreground },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}

                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDelete(menuJob)}
                >
                  <View
                    style={[
                      styles.menuItemIcon,
                      { backgroundColor: '#fff1f2' },
                    ]}
                  >
                    <Trash2 size={16} color='#ef4444' />
                  </View>
                  <Text style={[styles.menuItemText, { color: '#ef4444' }]}>
                    Delete Job
                  </Text>
                </TouchableOpacity>
              </Animated.View>
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
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  headerSub: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.8)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  postBtn: { borderRadius: 12, overflow: 'hidden' },
  postBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  postBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statItem: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(196,181,253,0.8)',
  },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#7c3aed' },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#8b7dc0' },
  tabTextActive: { color: '#7c3aed' },
  list: { padding: 16, gap: 12 },
  jobCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  jobTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  jobIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  jobDept: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  moreBtn: { padding: 4 },
  jobMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  jobMetaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  jobMetaText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  jobStatItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  jobStatValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  jobStatLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  jobStatDivider: { width: 1, height: 18 },
  viewCandsBtn: {
    marginLeft: 'auto',
    backgroundColor: '#f0eeff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  viewCandsText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor: '#f0eeff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#7c3aed' },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  menuSheet: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  menuJobIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f0eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuJobTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  menuDivider: { height: 1, marginVertical: 10 },
  menuSectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
