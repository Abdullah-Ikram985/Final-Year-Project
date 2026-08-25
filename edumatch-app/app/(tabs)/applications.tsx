import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, FileText, MapPin } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useColors } from '@/hooks/useColors';
import { candidateJobService } from '@/api/services/jobServices';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> =
  {
    pending: { label: 'Submitted', color: '#3b82f6', bg: '#eff6ff' },
    reviewed: { label: 'Under Review', color: '#f59e0b', bg: '#fffbeb' },
    shortlisted: {
      label: 'Interview Scheduled',
      color: '#10b981',
      bg: '#f0fdf4',
    },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
    hired: { label: 'Hired 🎉', color: '#7c3aed', bg: '#f0eeff' },
  };

const TIMELINE_INDEX: Record<string, number> = {
  pending: 0,
  reviewed: 1,
  shortlisted: 2,
  rejected: 1,
  hired: 3,
};

const STATUS_TABS = ['All', 'Active', 'Interview', 'Hired', 'Closed'];

export default function ApplicationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const [activeTab, setActiveTab] = useState('All');
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchAppliedJobs = async () => {
        setLoading(true);
        try {
          const res = await candidateJobService.getAppliedJobs();
          if (active) setAppliedJobs(res.data.appliedJobs ?? []);
        } catch (err) {
          console.error('Failed to fetch applied jobs:', err);
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchAppliedJobs();
      return () => {
        active = false;
      };
    }, []),
  );

  const filtered = appliedJobs.filter((entry) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active')
      return entry.status === 'pending' || entry.status === 'reviewed';
    if (activeTab === 'Interview') return entry.status === 'shortlisted';
    if (activeTab === 'Hired') return entry.status === 'hired';
    if (activeTab === 'Closed') return entry.status === 'rejected';
    return true;
  });

  const totalCount = appliedJobs.length;
  const activeCount = appliedJobs.filter(
    (e) => e.status === 'pending' || e.status === 'reviewed',
  ).length;
  const interviewCount = appliedJobs.filter(
    (e) => e.status === 'shortlisted',
  ).length;
  const hiredCount = appliedJobs.filter((e) => e.status === 'hired').length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerDecor} />
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerSub}>Track your application progress</Text>
        <View style={styles.statsRow}>
          {[
            {
              label: 'Total',
              value: String(totalCount),
              bg: 'rgba(255,255,255,0.15)',
            },
            {
              label: 'Active',
              value: String(activeCount),
              bg: 'rgba(59,130,246,0.3)',
            },
            {
              label: 'Interview',
              value: String(interviewCount),
              bg: 'rgba(16,185,129,0.3)',
            },
            {
              label: 'Hired',
              value: String(hiredCount),
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
        {STATUS_TABS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text
              style={[styles.tabText, activeTab === t && styles.tabTextActive]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#7c3aed' />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(entry) => entry.job._id}
          contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item: entry }) => {
            const job = entry.job;
            const statusKey = entry.status as string;
            const ui = STATUS_MAP[statusKey] ?? STATUS_MAP.pending;
            const activeIdx = TIMELINE_INDEX[statusKey] ?? 0;

            const initials = (job.createdBy?.companyName ?? job.title ?? '?')
              .split(' ')
              .slice(0, 2)
              .map((w: string) => w[0])
              .join('')
              .toUpperCase();

            const appliedDate = new Date(entry.appliedAt).toLocaleDateString(
              'en-US',
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              },
            );

            const isHired = statusKey === 'hired';

            return (
              <View
                style={[
                  styles.appCard,
                  { backgroundColor: colors.card },
                  isHired && styles.appCardHired,
                ]}
              >
                {/* Hired banner */}
                {isHired && (
                  <View style={styles.hiredBanner}>
                    <Text style={styles.hiredBannerText}>
                      🎉 Congratulations! You've been hired!
                    </Text>
                  </View>
                )}

                {/* Interview banner */}
                {statusKey === 'shortlisted' && (
                  <View style={styles.interviewBanner}>
                    <Calendar size={12} color='#10b981' />
                    <Text style={styles.interviewBannerText}>
                      Interview Scheduled
                    </Text>
                  </View>
                )}

                {/* Top row */}
                <View style={styles.appTop}>
                  <View
                    style={[
                      styles.appAvatar,
                      { backgroundColor: isHired ? '#f0eeff' : '#7c3aed18' },
                    ]}
                  >
                    <Text style={[styles.appAvatarText, { color: '#7c3aed' }]}>
                      {initials}
                    </Text>
                  </View>
                  <View style={styles.appMeta}>
                    <Text
                      style={[styles.appRole, { color: colors.foreground }]}
                    >
                      {job.title}
                    </Text>
                    <Text
                      style={[styles.appUni, { color: colors.mutedForeground }]}
                    >
                      {job.createdBy?.companyName ?? 'Company'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                      {job.department ? (
                        <Text
                          style={[
                            styles.appDept,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {job.department}
                        </Text>
                      ) : null}
                      {job.location ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} color={colors.mutedForeground} />
                          <Text
                            style={[
                              styles.appDept,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {job.location}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: ui.bg }]}
                  >
                    <Text style={[styles.statusText, { color: ui.color }]}>
                      {ui.label}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.appFooter}>
                  <View style={styles.footerLeft}>
                    <Clock size={12} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.footerText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Applied {appliedDate}
                    </Text>
                  </View>
                  {entry.matchPercent != null && (
                    <View style={styles.matchPill}>
                      <Text style={styles.matchText}>
                        {entry.matchPercent}% match
                      </Text>
                    </View>
                  )}
                </View>

                {/* Timeline */}
                <View style={styles.timeline}>
                  {['Submitted', 'Under Review', 'Interview', 'Decision'].map(
                    (step, i) => {
                      const done = i <= activeIdx;
                      return (
                        <React.Fragment key={step}>
                          <View style={styles.timelineStep}>
                            <View
                              style={[
                                styles.timelineDot,
                                done
                                  ? isHired
                                    ? styles.timelineDotHired
                                    : styles.timelineDotDone
                                  : styles.timelineDotPending,
                              ]}
                            />
                            <Text
                              style={[
                                styles.timelineLabel,
                                {
                                  color: done
                                    ? isHired
                                      ? '#7c3aed'
                                      : '#7c3aed'
                                    : colors.mutedForeground,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {step}
                            </Text>
                          </View>
                          {i < 3 && (
                            <View
                              style={[
                                styles.timelineLine,
                                {
                                  backgroundColor:
                                    done && i < activeIdx
                                      ? '#7c3aed'
                                      : '#e5e0f8',
                                },
                              ]}
                            />
                          )}
                        </React.Fragment>
                      );
                    },
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText size={40} color='#c4b5fd' />
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                No applications here
              </Text>
              <Text
                style={[styles.emptySubText, { color: colors.mutedForeground }]}
              >
                Apply to jobs to track them here
              </Text>
            </View>
          }
        />
      )}
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
    marginBottom: 14,
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(196,181,253,0.8)',
  },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#7c3aed' },
  tabText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#8b7dc0' },
  tabTextActive: { color: '#7c3aed' },
  list: { padding: 16, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  appCardHired: { borderWidth: 1.5, borderColor: '#7c3aed' },
  hiredBanner: {
    backgroundColor: '#f0eeff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  hiredBannerText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  interviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  interviewBannerText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#10b981',
  },
  appTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  appAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  appAvatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  appMeta: { flex: 1 },
  appRole: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  appUni: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 1 },
  appDept: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  appFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  timeline: { flexDirection: 'row', alignItems: 'center' },
  timelineStep: { alignItems: 'center', gap: 4, flex: 1 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineDotDone: { backgroundColor: '#7c3aed' },
  timelineDotHired: { backgroundColor: '#7c3aed' },
  timelineDotPending: { backgroundColor: '#e5e0f8' },
  timelineLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  timelineLine: { flex: 1, height: 2, marginBottom: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySubText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  matchPill: {
    backgroundColor: '#f0eeff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  matchText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#7c3aed' },
});
