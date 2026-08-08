import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Briefcase,
  CheckCircle,
  Clock,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {allRecruiterCandidatesService} from '@/api/services/recruiterService';
import {
  jobApplicantsService,
  updateApplicantStatusService,
} from '@/api/services/jobServices';
import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Applicant {
  _id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  candidate: {
    _id: string;
    title?: string;
    location?: string;
    skills?: string[];
    experience?: { title: string; company: string; duration: string }[];
    education?: { degree: string; institution: string; year: string }[];
    pdfUrl?: string;
    user?: { name: string; email: string; imageUrl?: string };
  };
  matchPercent?: number;
  matchLabel?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ['All', 'Pending', 'Reviewed', 'Shortlisted', 'Hired', 'Rejected'];

const STATUS_OPTIONS = [
  {
    value: 'pending',
    label: 'Pending',
    icon: Clock,
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    value: 'reviewed',
    label: 'Reviewed',
    icon: CheckCircle,
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    value: 'shortlisted',
    label: 'Shortlist',
    icon: Star,
    color: '#10b981',
    bg: '#f0fdf4',
  },
  {
    value: 'hired',
    label: 'Hire',
    icon: CheckCircle,
    color: '#7c3aed',
    bg: '#f0eeff',
  },
  {
    value: 'rejected',
    label: 'Reject',
    icon: XCircle,
    color: '#ef4444',
    bg: '#fef2f2',
  },
];

const STATUS_DISPLAY: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
  reviewed: { label: 'Reviewed', color: '#3b82f6', bg: '#eff6ff' },
  shortlisted: { label: 'Shortlisted', color: '#10b981', bg: '#f0fdf4' },
  hired: { label: 'Hired ✓', color: '#7c3aed', bg: '#f0eeff' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
};

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
export default function CandidatesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { jobId, jobTitle } = useLocalSearchParams<{
    jobId: string;
    jobTitle: string;
  }>();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [statusModal, setStatusModal] = useState<Applicant | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchApplicants = useCallback(
    async (silent = false) => {
      if (!jobId) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await jobApplicantsService.getApplicants(jobId);
        setApplicants(res.data.applicants ?? []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load applicants');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [jobId],
  );
 
  useFocusEffect(
    useCallback(() => {
      fetchApplicants();
    }, [fetchApplicants]),
  );

  // ─── Status change ────────────────────────────────────────────────────────
  const handleStatusChange = async (
    applicant: Applicant,
    newStatus: string,
  ) => {
    // Confirm hire action
    if (newStatus === 'hired') {
      Alert.alert(
        'Hire Candidate',
        `Are you sure you want to hire ${applicant.candidate?.user?.name ?? 'this candidate'}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setStatusModal(null),
          },
          {
            text: 'Hire',
            onPress: () => performStatusChange(applicant, newStatus),
          },
        ],
      );
      return;
    }
    setStatusModal(null);
    performStatusChange(applicant, newStatus);
  };

  const performStatusChange = async (
    applicant: Applicant,
    newStatus: string,
  ) => {
    setStatusModal(null);
    setUpdatingId(applicant._id);
    try {
      await updateApplicantStatusService.updateStatus(
        jobId,
        applicant.candidate._id,
        newStatus,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchApplicants(true);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'Failed to update status',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filtered = applicants.filter((a) => {
    const name = a.candidate?.user?.name ?? '';
    const matchesSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      (a.candidate?.skills ?? []).some((s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      ) ||
      (a.candidate?.title ?? '').toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === 'All' || a.status.toLowerCase() === activeTab.toLowerCase();

    return matchesSearch && matchesTab;
  });

  const counts = {
    All: applicants.length,
    Pending: applicants.filter((a) => a.status === 'pending').length,
    Reviewed: applicants.filter((a) => a.status === 'reviewed').length,
    Shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
    Hired: applicants.filter((a) => a.status === 'hired').length,
    Rejected: applicants.filter((a) => a.status === 'rejected').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1e1b4b', '#2e1a6e']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerDecor} />
        <Text style={styles.headerTitle}>Applicants</Text>
        <Text style={styles.headerSub} numberOfLines={1}>
          {jobTitle ?? 'Job Applicants'}
        </Text>

        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: counts.All, bg: 'rgba(255,255,255,0.15)' },
            {
              label: 'Shortlisted',
              value: counts.Shortlisted,
              bg: 'rgba(16,185,129,0.3)',
            },
            { label: 'Hired', value: counts.Hired, bg: 'rgba(124,58,237,0.3)' },
            {
              label: 'Pending',
              value: counts.Pending,
              bg: 'rgba(245,158,11,0.3)',
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

        <View style={styles.searchBar}>
          <Search size={16} color='#8b7dc0' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search by name or skill...'
            placeholderTextColor='#8b7dc0'
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <XCircle size={16} color='#8b7dc0' />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabsWrap,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((t) => (
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
            {counts[t as keyof typeof counts] > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  activeTab === t && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === t && styles.tabBadgeTextActive,
                  ]}
                >
                  {counts[t as keyof typeof counts]}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size='large' color='#7c3aed' />
          <Text style={[styles.centerText, { color: colors.mutedForeground }]}>
            Loading applicants...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchApplicants()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a._id}
          contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item: applicant }) => {
            const candidate = applicant.candidate;
            const name = candidate?.user?.name ?? 'Unknown';
            const avatarColor = getAvatarColor(candidate._id);
            const initials = getInitials(name);
            const statusUi =
              STATUS_DISPLAY[applicant.status] ?? STATUS_DISPLAY.pending;
            const isUpdating = updatingId === applicant._id;
            const isHired = applicant.status === 'hired';

            const appliedDate = new Date(
              applicant.appliedAt,
            ).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <View
                style={[
                  styles.candCard,
                  { backgroundColor: colors.card },
                  isHired && styles.candCardHired,
                ]}
              >
                {/* Hired banner */}
                {isHired && (
                  <View style={styles.hiredBanner}>
                    <CheckCircle size={13} color='#7c3aed' />
                    <Text style={styles.hiredBannerText}>Hired</Text>
                  </View>
                )}

                {/* Top row */}
                <View style={styles.cardTop}>
                  {candidate?.user?.imageUrl ? (
                    <Image
                      source={{ uri: candidate.user.imageUrl }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: avatarColor + '20' },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: avatarColor }]}>
                        {initials}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.foreground }]}>
                      {name}
                    </Text>
                    <Text
                      style={[styles.role, { color: colors.mutedForeground }]}
                    >
                      {candidate?.title ?? 'Candidate'}
                    </Text>
                    <Text
                      style={[
                        styles.appliedText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Applied {appliedDate}
                    </Text>
                  </View>

                  {/* Status badge — display only */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusUi.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusUi.color }]}
                    >
                      {statusUi.label}
                    </Text>
                  </View>
                </View>

                {/* Skills */}
                {(candidate?.skills ?? []).length > 0 && (
                  <View style={styles.skillsWrap}>
                    {(candidate.skills ?? []).slice(0, 5).map((s) => (
                      <View key={s} style={styles.skillTag}>
                        <Text style={styles.skillTagText}>{s}</Text>
                      </View>
                    ))}
                    {(candidate?.skills?.length ?? 0) > 5 && (
                      <View style={styles.skillTag}>
                        <Text style={styles.skillTagText}>
                          +{(candidate.skills?.length ?? 0) - 5}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Match score row */}
                <View
                  style={[styles.scoreRow, { borderTopColor: colors.border }]}
                >
                  {applicant.matchPercent != null ? (
                    <View style={styles.matchPill}>
                      <Sparkles size={11} color='#10b981' />
                      <Text style={styles.matchText}>
                        {applicant.matchPercent}% match
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.matchPillEmpty}>
                      <Text
                        style={[
                          styles.matchEmptyText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        No match score
                      </Text>
                    </View>
                  )}
                  {applicant.matchLabel && (
                    <View style={styles.matchLabelPill}>
                      <Text style={styles.matchLabelText}>
                        {applicant.matchLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action buttons */}
                <View
                  style={[
                    styles.cardActions,
                    { borderTopColor: colors.border },
                  ]}
                >
                  {/* Change Status */}
                  {isUpdating ? (
                    <View
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.background, flex: 1 },
                      ]}
                    >
                      <ActivityIndicator size='small' color='#7c3aed' />
                      <Text style={styles.actionBtnText}>Updating...</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStatusModal(applicant);
                      }}
                    >
                      <SlidersHorizontal size={13} color='#7c3aed' />
                      <Text style={styles.actionBtnText}>Change Status</Text>
                    </TouchableOpacity>
                  )}

                  {/* View Profile */}
                  <TouchableOpacity
                    style={styles.resumeBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/candidate-detail',
                        params: { candidateId: candidate._id, jobId: jobId },
                      });
                    }}
                  >
                    <LinearGradient
                      colors={
                        isHired
                          ? ['#10b981', '#059669']
                          : ['#7c3aed', '#6d28d9']
                      }
                      style={styles.resumeBtnGrad}
                    >
                      <Text style={styles.resumeBtnText}>
                        {isHired ? 'Hired Profile' : 'View Profile'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={40} color='#c4b5fd' />
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                {search
                  ? 'No candidates match your search'
                  : `No ${activeTab === 'All' ? '' : activeTab.toLowerCase()} applicants yet`}
              </Text>
              <Text
                style={[styles.emptySubText, { color: colors.mutedForeground }]}
              >
                {search
                  ? 'Try a different search term'
                  : 'Share this job to attract candidates'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Status Change Modal ── */}
      <Modal
        visible={!!statusModal}
        transparent
        animationType='fade'
        onRequestClose={() => setStatusModal(null)}
      >
        <TouchableWithoutFeedback onPress={() => setStatusModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[styles.modalSheet, { backgroundColor: colors.card }]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[styles.modalTitle, { color: colors.foreground }]}
                  >
                    Update Status
                  </Text>
                  <Text
                    style={[styles.modalSub, { color: colors.mutedForeground }]}
                  >
                    {statusModal?.candidate?.user?.name ?? 'Candidate'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.modalDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {STATUS_OPTIONS.filter(
                  (o) => o.value !== statusModal?.status,
                ).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={styles.modalItem}
                      onPress={() =>
                        statusModal &&
                        handleStatusChange(statusModal, opt.value)
                      }
                    >
                      <View
                        style={[
                          styles.modalItemIcon,
                          { backgroundColor: opt.bg },
                        ]}
                      >
                        <Icon size={16} color={opt.color} />
                      </View>
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: colors.foreground },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[
                    styles.modalCancelBtn,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => setStatusModal(null)}
                >
                  <Text
                    style={[
                      styles.modalCancelText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
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
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(196,181,253,0.8)',
    fontFamily: 'Inter_500Medium',
    marginBottom: 14,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  tabsWrap: { borderBottomWidth: 1, maxHeight: 52 },
  tabsContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabActive: { borderBottomColor: '#7c3aed' },
  tabText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#8b7dc0' },
  tabTextActive: { color: '#7c3aed' },
  tabBadge: {
    backgroundColor: '#e5e0f8',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: '#7c3aed' },
  tabBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#7c3aed' },
  tabBadgeTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  candCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  candCardHired: { borderWidth: 1.5, borderColor: '#7c3aed' },
  hiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0eeff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  hiredBannerText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24, flexShrink: 0 },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  role: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  appliedText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  skillTagText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  matchText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#10b981' },
  matchPillEmpty: { paddingHorizontal: 10, paddingVertical: 5 },
  matchEmptyText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  matchLabelPill: {
    backgroundColor: '#f0eeff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  matchLabelText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
    paddingVertical: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  resumeBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  resumeBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  resumeBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySubText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalSheet: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { marginBottom: 12 },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  modalDivider: { height: 1, marginBottom: 10 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  modalItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modalCancelBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
