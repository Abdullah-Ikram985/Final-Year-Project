import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  Banknote,
  Bookmark,
  Briefcase,
  CheckCircle,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from 'lucide-react-native';
import React, { Component, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { savedJobServices } from '@/api/services/candidateServices';
import { allJobsService } from '@/api/services/jobServices';
import { useColors } from '@/hooks/useColors';

interface Job {
  _id: any;
  title?: string;
  department?: string;
  location?: string;
  salary?: number;
  jobType?: string;
  skills?: string[] | null;
  description?: string;
  jobStatus?: string;
  matchPercent?: number | null;
  matchLabel?: string;
  createdBy?: { _id: any };
}

const toStr = (id: any): string => (id ? String(id) : '');

const getInitials = (title?: string) => {
  if (!title) return '?';
  return (
    title
      .split(' ')
      .slice(0, 2)
      .map((w) => w?.[0] ?? '')
      .join('')
      .toUpperCase() || '?'
  );
};

const AVATAR_COLORS = [
  '#dc2626',
  '#7c3aed',
  '#0369a1',
  '#d97706',
  '#10b981',
  '#db2777',
];

const getAvatarColor = (id: any) => {
  const s = toStr(id);
  if (!s) return AVATAR_COLORS[0];
  return AVATAR_COLORS[s.charCodeAt(s.length - 1) % AVATAR_COLORS.length];
};

const FILTERS = [
  'All',
  'Full-time',
  'Part-time',
  'Contract',
  'Visiting',
  'Remote',
];

const isJobActive = (jobStatus?: string) =>
  jobStatus?.toLowerCase() === 'active';

interface CardBoundaryState {
  hasError: boolean;
  errorMsg: string;
}
class CardErrorBoundary extends Component<
  { children: React.ReactNode },
  CardBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message ?? 'Unknown error' };
  }
  componentDidCatch(error: Error) {
    console.error('[JobCard render crash]', error.message, error.stack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={cardBoundaryStyles.container}>
          <Text style={cardBoundaryStyles.icon}>⚠️</Text>
          <Text style={cardBoundaryStyles.title}>
            Could not display this job
          </Text>
          <Text style={cardBoundaryStyles.detail}>{this.state.errorMsg}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
const cardBoundaryStyles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 20,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 12,
    alignItems: 'center',
    gap: 4,
  },
  icon: { fontSize: 24 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#c2410c' },
  detail: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#9a3412',
    textAlign: 'center',
  },
});

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [savedJobsLoading, setSavedJobsLoading] = useState(true);

  const isFirstLoad = useRef(true);

  const fetchJobs = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      try {
        if (mode === 'initial') setLoading(true);
        if (mode === 'refresh') setRefreshing(true);
        setError(null);
        const res = await allJobsService.getAllJobs();
        const raw = res?.data;
        const list: Job[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.jobs)
            ? raw.jobs
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
        console.log('[JobsScreen] fetched', list.length, 'jobs');
        setJobs(list);
      } catch (err: any) {
        console.error('[JobsScreen] fetch error', err?.message);
        if (mode !== 'silent') {
          setError(err?.message ?? 'Failed to load jobs');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const fetchSavedJobs = useCallback(async () => {
    try {
      setSavedJobsLoading(true);
      const res = await savedJobServices.getSavedJobs();
      const saved = res?.data?.savedJobs ?? [];
      setSavedJobs(new Set(saved.map((j: any) => toStr(j._id))));
    } catch (err) {
      console.warn('[JobsScreen] fetchSavedJobs error:', err);
    } finally {
      setSavedJobsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        fetchJobs('initial');
        fetchSavedJobs();
      } else {
        fetchJobs('silent');
        fetchSavedJobs();
      }
    }, [fetchJobs, fetchSavedJobs]),
  );

  const filtered = jobs.filter((j) => {
    const dept = j.department ?? '';
    const title = j.title ?? '';
    const loc = j.location ?? '';

    const matchesFilter =
      activeFilter === 'All' ||
      j.jobType === activeFilter ||
      dept.toLowerCase().includes(activeFilter.toLowerCase());

    const matchesSearch =
      search === '' ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      dept.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeJobsList = filtered
    .filter((j) => isJobActive(j.jobStatus))
    .sort((a, b) => (b.matchPercent ?? 0) - (a.matchPercent ?? 0));

  const closedJobsList = filtered
    .filter((j) => !isJobActive(j.jobStatus))
    .sort((a, b) => (b.matchPercent ?? 0) - (a.matchPercent ?? 0));

  const sorted = [...activeJobsList, ...closedJobsList];

  const toggleSave = async (jobId: string) => {
    if (savingJobId) return;
    try {
      setSavingJobId(jobId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const isSaved = savedJobs.has(jobId);
      setSavedJobs((prev) => {
        const next = new Set(prev);
        isSaved ? next.delete(jobId) : next.add(jobId);
        return next;
      });
      if (isSaved) {
        await savedJobServices.unsaveJob(jobId);
      } else {
        await savedJobServices.saveJob(jobId);
      }
    } catch (err: any) {
      setSavedJobs((prev) => {
        const next = new Set(prev);
        savedJobs.has(jobId) ? next.add(jobId) : next.delete(jobId);
        return next;
      });
    } finally {
      setSavingJobId(null);
    }
  };

  const formatSalary = (salary?: number | null) => {
    if (salary == null) return '—';
    return salary >= 1000 ? `${Math.round(salary / 1000)}k` : `${salary}`;
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size='large' color='#7c3aed' />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Finding your best matches…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => fetchJobs('initial')}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerDecor} />
        <Text style={styles.headerTitle}>Browse Jobs</Text>
        <Text style={styles.headerSub}>
          All open positions posted by recruiters
        </Text>
        <View style={styles.searchBar}>
          <Search size={18} color='#8b7dc0' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search roles, departments...'
            placeholderTextColor='#8b7dc0'
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal size={18} color='#7c3aed' />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter chips */}
      <View style={[styles.filtersWrap, { backgroundColor: colors.card }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((value) => {
            const isActive = activeFilter === value;
            return (
              <TouchableOpacity
                key={value}
                activeOpacity={0.75}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Count */}
      {sorted.length > 0 && (
        <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
          {activeJobsList.length} active · {closedJobsList.length} closed
        </Text>
      )}

      {/* List */}
      <FlatList
        data={sorted}
        extraData={[savedJobs, savingJobId, savedJobsLoading]}
        keyExtractor={(j) => toStr(j._id)}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              fetchJobs('refresh');
              fetchSavedJobs();
            }}
            tintColor='#7c3aed'
          />
        }
        renderItem={({ item: job, index }) => {
          if (!job._id || !job.title) return null;
          const id = toStr(job._id);
          const jobActive = isJobActive(job.jobStatus);
          const matchPct =
            job.matchPercent != null && !isNaN(Number(job.matchPercent))
              ? Number(job.matchPercent)
              : null;
          const hasMatch = matchPct !== null;
          const isBest =
            index === 0 && jobActive && hasMatch && matchPct! >= 70;
          const avatarColor = getAvatarColor(id);
          const initials = getInitials(job.title);
          const isSaved = savedJobs.has(id);
          const isSaving = savingJobId === id;
          const skills = Array.isArray(job.skills) ? job.skills : [];

          return (
            <CardErrorBoundary>
              <View
                style={[
                  styles.jobCard,
                  { backgroundColor: colors.card },
                  isBest && styles.jobCardBest,
                  !jobActive && styles.jobCardClosed,
                ]}
              >
                {/* Best Match badge — only for active jobs */}
                {isBest && (
                  <LinearGradient
                    colors={['#7c3aed', '#6d28d9']}
                    style={styles.bestBadge}
                  >
                    <Sparkles size={10} color='#fff' />
                    <Text style={styles.bestBadgeText}>Best Match</Text>
                  </LinearGradient>
                )}

                {/* Top row */}
                <View style={styles.jobTop}>
                  <View
                    style={[
                      styles.jobAvatar,
                      {
                        backgroundColor: jobActive
                          ? avatarColor + '18'
                          : '#e5e7eb',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.jobAvatarText,
                        { color: jobActive ? avatarColor : '#9ca3af' },
                      ]}
                    >
                      {initials}
                    </Text>
                  </View>

                  <View style={styles.jobTopMeta}>
                    <Text
                      style={[
                        styles.jobRole,
                        { color: jobActive ? colors.foreground : '#9ca3af' },
                      ]}
                      numberOfLines={2}
                    >
                      {job.title ?? 'Untitled'}
                    </Text>
                    <Text
                      style={[styles.jobUni, { color: colors.mutedForeground }]}
                    >
                      {job.department ?? '—'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleSave(id)}
                    style={styles.bookmarkBtn}
                    disabled={isSaving || savedJobsLoading}
                  >
                    {isSaving ? (
                      <ActivityIndicator size='small' color='#7c3aed' />
                    ) : (
                      <Bookmark
                        size={20}
                        color={isSaved ? '#7c3aed' : colors.mutedForeground}
                        fill={isSaved ? '#7c3aed' : 'none'}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Status badge — shows Active (green) or Closed (red) */}
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      jobActive
                        ? styles.statusBadgeActive
                        : styles.statusBadgeClosed,
                    ]}
                  >
                    {jobActive ? (
                      <CheckCircle size={11} color='#059669' />
                    ) : (
                      <XCircle size={11} color='#dc2626' />
                    )}
                    <Text
                      style={[
                        styles.statusBadgeText,
                        jobActive
                          ? styles.statusBadgeTextActive
                          : styles.statusBadgeTextClosed,
                      ]}
                    >
                      {jobActive ? 'Active' : 'Closed'}
                    </Text>
                  </View>
                </View>

                {/* Meta tags */}
                <View style={styles.jobMeta}>
                  {!!job.jobType && (
                    <View style={styles.jobMetaTag}>
                      <Briefcase size={12} color={colors.mutedForeground} />
                      <Text
                        style={[
                          styles.jobMetaText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {job.jobType}
                      </Text>
                    </View>
                  )}
                  {!!job.location && (
                    <View style={styles.jobMetaTag}>
                      <MapPin size={12} color={colors.mutedForeground} />
                      <Text
                        style={[
                          styles.jobMetaText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {job.location}
                      </Text>
                    </View>
                  )}
                  {job.salary != null && (
                    <View style={styles.jobMetaTag}>
                      <Banknote size={12} color={colors.mutedForeground} />
                      <Text
                        style={[
                          styles.jobMetaText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formatSalary(job.salary)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Skills */}
                {skills.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.skillsRow}
                  >
                    {skills.map((skill, i) => (
                      <View key={`${skill}-${i}`} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Bottom row */}
                <View style={styles.jobBottom}>
                  {hasMatch ? (
                    <View
                      style={[
                        styles.matchPill,
                        {
                          backgroundColor:
                            matchPct! >= 90 ? '#f0fdf4' : '#f0eeff',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.matchDot,
                          {
                            backgroundColor:
                              matchPct! >= 90 ? '#10b981' : '#7c3aed',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.matchPillText,
                          { color: matchPct! >= 90 ? '#10b981' : '#7c3aed' },
                        ]}
                      >
                        {matchPct!.toFixed(1)}% · {job.matchLabel ?? 'Match'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.noMatchPill}>
                      <Text style={styles.noMatchPillText}>Score pending</Text>
                    </View>
                  )}
                  
                  {jobActive ? (
                    <TouchableOpacity
                      style={[styles.applyBtn, isBest && styles.applyBtnBest]}
                      activeOpacity={0.75}
                      onPress={() =>
                        router.push({
                          pathname: '/job-detail',
                          params: { jobId: id },
                        })
                      }
                    >
                      {isBest ? (
                        <LinearGradient
                          colors={['#7c3aed', '#6d28d9']}
                          style={styles.applyGradient}
                        >
                          <Text style={styles.applyBtnTextWhite}>
                            Quick Apply
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text
                          style={[styles.applyBtnText, { color: '#1e1b4b' }]}
                        >
                          Apply
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    // Closed job — not clickable, clearly labelled
                    <View style={styles.closedBtn}>
                      <Text style={styles.closedBtnText}>
                        No Longer Accepting
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </CardErrorBoundary>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={40} color='#c4b5fd' />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No jobs found
            </Text>
            <Text
              style={[styles.emptySubText, { color: colors.mutedForeground }]}
            >
              Try a different search or filter
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8 },
  errorText: { fontSize: 15, color: '#dc2626', fontFamily: 'Inter_500Medium' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  resultCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
  },
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
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.8)',
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  filterBtn: { padding: 4 },
  filtersWrap: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e0f8',
    justifyContent: 'center',
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: '#f0eeff',
    borderWidth: 1,
    borderColor: '#e5e0f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterChipTextActive: { color: '#ffffff' },
  list: { padding: 16, gap: 12 },
  jobCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  jobCardBest: { borderWidth: 1.5, borderColor: '#7c3aed' },
  jobCardClosed: { borderWidth: 1, borderColor: '#e5e7eb', opacity: 0.7 },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  bestBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  jobTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  jobAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  jobAvatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  jobTopMeta: { flex: 1 },
  jobRole: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  jobUni: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  bookmarkBtn: { padding: 4 },
  statusRow: { marginBottom: 10 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeActive: { backgroundColor: '#d1fae5' },
  statusBadgeClosed: { backgroundColor: '#fee2e2' },
  statusBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  statusBadgeTextActive: { color: '#059669' },
  statusBadgeTextClosed: { color: '#dc2626' },
  jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
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
  skillsRow: { marginBottom: 14 },
  skillChip: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  skillChipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#7c3aed',
  },
  jobBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchDot: { width: 6, height: 6, borderRadius: 3 },
  matchPillText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  noMatchPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noMatchPillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#9ca3af',
  },
  applyBtn: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#f0eeff',
    overflow: 'hidden',
  },
  applyBtnBest: { backgroundColor: 'transparent', padding: 0 },
  applyGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyBtnTextWhite: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  applyBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  // ─── Closed button — not a TouchableOpacity, just a View so it's
  //     completely unclickable and visually distinct
  closedBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  closedBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#9ca3af',
  },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySubText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
