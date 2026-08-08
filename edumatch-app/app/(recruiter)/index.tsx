import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recruiterDashboardService } from '@/api/services/recruiterService';
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
  totalCandidates: number;
  totalShortlisted: number;
  totalHired: number;
  jobBreakdown: JobBreakdown[];
}

const RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'application',
    text: 'New candidates applied to your job postings',
    time: 'Recently',
    Icon: UserCheck,
    color: '#7c3aed',
    bg: '#f0eeff',
  },
  {
    id: '2',
    type: 'interview',
    text: 'Review shortlisted candidates',
    time: '',
    Icon: Calendar,
    color: '#10b981',
    bg: '#f0fdf4',
  },
  {
    id: '3',
    type: 'view',
    text: 'Check your job posting performance',
    time: '',
    Icon: Eye,
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    id: '4',
    type: 'match',
    text: 'AI-matched candidates ready for review',
    time: '',
    Icon: Sparkles,
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

export default function RecruiterDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  // ─── Fetch stats on every focus ───────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchStats = async () => {
        setStatsLoading(true);
        try {
          const res = await recruiterDashboardService.getStats();
          if (active) setStats(res.data);
        } catch (err: any) {
          console.error('Failed to fetch dashboard stats:', err?.message);
        } finally {
          if (active) setStatsLoading(false);
        }
      };

      fetchStats();
      return () => {
        active = false;
      };
    }, []),
  );

  const statCards = [
    {
      label: 'Active Jobs',
      value: statsLoading ? '...' : String(stats?.activeJobs ?? 0),
      Icon: Briefcase,
      bg: '#f0eeff',
      iconColor: '#7c3aed',
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
          {/* <TouchableOpacity style={styles.notifBtn}>
            <Bell size={22} color='rgba(196,181,253,0.9)' />
            <View style={styles.notifDot} />
          </TouchableOpacity> */}
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
        <View style={styles.statsRow}>
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

        {/* ── Hired stat ── */}
        {!statsLoading && stats && stats.totalHired > 0 && (
          <View style={[styles.hiredCard, { backgroundColor: '#f0eeff' }]}>
            <CheckCircle size={18} color='#7c3aed' />
            <Text style={styles.hiredCardText}>
              {stats.totalHired} candidate{stats.totalHired !== 1 ? 's' : ''}{' '}
              hired across all your jobs
            </Text>
          </View>
        )}

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
                label: 'Manage Jobs',
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  orgText: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.7)',
    fontFamily: 'Inter_500Medium',
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
  actionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(168,85,247,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  actionSub: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.8)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  actionCta: { borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-end' },
  actionCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionCtaText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
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
  hiredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  hiredCardText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
    flex: 1,
  },
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 14 },
  seeAll: { fontSize: 13, color: '#7c3aed', fontFamily: 'Inter_600SemiBold' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionItem: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  actionItemIcon: {
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

  // Job breakdown
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  countItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  countValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  countLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  countDivider: { width: 1, height: 18 },
  emptyBreakdown: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyBreakdownText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  // Activity
  activityRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityText: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  activityTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  activityTime: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
