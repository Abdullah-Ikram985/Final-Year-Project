import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Clock,
  Laptop,
  Rocket,
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { resumeService } from '@/api/services/resumeService';

// ─── Backend shape ────────────────────────────────────────────────────────────

interface MissingSkillAPI {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  _id: string;
}

interface TargetRoleAPI {
  role: string;
  matchPercent: number;
  whyThisRole: string;
  missingSkills: MissingSkillAPI[];
  _id: string;
}

interface CourseAPI {
  title: string;
  platform: string;
  duration: string;
  level: string;
  urlHint: string;
  _id: string;
}

interface LearningRoadmapItemAPI {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  courses: CourseAPI[];
  _id: string;
}

interface CareerRoadmapData {
  careerInsight?: { domain: string; summary: string };
  targetRoles?: TargetRoleAPI[];
  learningRoadmap?: LearningRoadmapItemAPI[];
  overallRecommendation?: {
    bestRole: string;
    reason: string;
    nextStep: string;
  };
}

// ─── UI-ready shapes ──────────────────────────────────────────────────────────

interface UIRole {
  label: string;
  match: number;
  why: string;
  missingSkills: UIMissingSkill[];
}

interface UIMissingSkill {
  skill: string;
  priority: string; // 'High' | 'Medium' | 'Low'
  coursesAvailable: number; // count from learningRoadmap
}

interface UICourse {
  id: string;
  title: string;
  platform: string;
  duration: string;
  level: string;
  skill: string; // parent roadmap skill label
  urlHint: string;
  color: string;
  bg: string;
}

// ─── Colour palette for courses / priority levels ────────────────────────────

const COURSE_PALETTE = [
  { color: '#3b82f6', bg: '#eff6ff' },
  { color: '#10b981', bg: '#f0fdf4' },
  { color: '#f59e0b', bg: '#fffbeb' },
  { color: '#8b5cf6', bg: '#f5f3ff' },
  { color: '#ec4899', bg: '#fdf2f8' },
];

function priorityLabel(p: string) {
  const m: Record<string, string> = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };
  return m[p] ?? p;
}

function priorityColors(p: string): { color: string; bg: string } {
  if (p === 'HIGH' || p === 'High') return { color: '#ef4444', bg: '#fef2f2' };
  if (p === 'MEDIUM' || p === 'Medium')
    return { color: '#f59e0b', bg: '#fffbeb' };
  return { color: '#3b82f6', bg: '#eff6ff' };
}

// ─── Course link helpers ──────────────────────────────────────────────────────

function buildCourseUrl(course: UICourse): string {
  if (course.urlHint && /^https?:\/\//i.test(course.urlHint.trim())) {
    return course.urlHint.trim();
  }

  const query = encodeURIComponent(course.title);

  switch (course.platform.trim().toLowerCase()) {
    case 'udemy':
      return `https://www.udemy.com/courses/search/?q=${query}`;
    case 'coursera':
      return `https://www.coursera.org/search?query=${query}`;
    case 'edx':
      return `https://www.edx.org/search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${query}+course`;
  }
}

async function openCourse(
  course: UICourse,
  onError?: (message: string) => void,
) {
  const url = buildCourseUrl(course);
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn('Cannot open course URL:', url);
      onError?.('Unable to open this course link on your device.');
    }
  } catch (err) {
    console.error('Failed to open course:', err);
    onError?.('Something went wrong opening this course.');
  }
}

// ─── Transform API → UI ───────────────────────────────────────────────────────

function transformData(data: CareerRoadmapData): {
  roles: UIRole[];
  allCourses: UICourse[];
} {
  const roadmap = data.learningRoadmap ?? [];

  // Build a lookup: normalised skill string → course count
  const skillCoursesCount = new Map<string, number>();
  roadmap.forEach((item) => {
    skillCoursesCount.set(item.skill.trim().toLowerCase(), item.courses.length);
  });

  // Flatten all courses with palette colours
  const allCourses: UICourse[] = [];
  roadmap.forEach((item, itemIdx) => {
    item.courses.forEach((c) => {
      const palette = COURSE_PALETTE[itemIdx % COURSE_PALETTE.length];
      allCourses.push({
        id: c._id,
        title: c.title,
        platform: c.platform,
        duration: c.duration,
        level: c.level,
        skill: item.skill,
        urlHint: c.urlHint,
        color: palette.color,
        bg: palette.bg,
      });
    });
  });

  // Transform target roles
  const roles: UIRole[] = (data.targetRoles ?? []).map((r) => ({
    label: r.role,
    match: r.matchPercent,
    why: r.whyThisRole,
    missingSkills: r.missingSkills.map((s) => {
      // Try to find course count from learningRoadmap by matching partial skill name
      const key = s.skill.trim().toLowerCase();
      let count = 0;
      skillCoursesCount.forEach((v, k) => {
        // Partial keyword match
        const kWords = k.split(/\s+/).slice(0, 3).join(' ');
        const sWords = key.split(/\s+/).slice(0, 3).join(' ');
        if (k.includes(sWords) || key.includes(kWords)) {
          count = Math.max(count, v);
        }
      });
      return {
        skill: s.skill,
        priority: priorityLabel(s.priority),
        coursesAvailable: (count || roadmap[0]?.courses.length) ?? 2,
      };
    }),
  }));

  return { roles, allCourses };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CareerRoadmapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<CareerRoadmapData | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    const fetchCareerRoadmap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await resumeService.getCareerRoadmap();
        // API returns { success: true, data: { ... } }
        const payload = response?.data ?? response;
        console.log('Career roadmap data:', payload);
        setRawData(payload);
      } catch (err: any) {
        console.error('Failed to fetch career roadmap:', err);
        setError(
          err?.response?.data?.message || 'Failed to load career roadmap',
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareerRoadmap();
  }, []);

  // Clear any transient link-open error toast after a few seconds
  useEffect(() => {
    if (!linkError) return;
    const t = setTimeout(() => setLinkError(null), 3000);
    return () => clearTimeout(t);
  }, [linkError]);

  const { roles, allCourses } = rawData
    ? transformData(rawData)
    : { roles: [], allCourses: [] };

  const currentRole = roles[selectedRole];
  const currentMatch = currentRole?.match ?? 0;
  const targetMatch = 90;
  const gap = Math.max(0, targetMatch - currentMatch);

  // Courses relevant to the selected role: match by missing skill keywords
  const roleCourses = currentRole
    ? allCourses
        .filter((c) =>
          currentRole.missingSkills.some((ms) => {
            const msWords = ms.skill
              .toLowerCase()
              .split(/\s+/)
              .slice(0, 3)
              .join(' ');
            return c.skill.toLowerCase().includes(msWords.split(' ')[0]);
          }),
        )
        .slice(0, 4)
    : allCourses.slice(0, 4);

  // Show all courses if role-filtered set is empty
  const displayCourses =
    roleCourses.length > 0 ? roleCourses : allCourses.slice(0, 4);

  const insight = rawData?.careerInsight;
  const recommendation = rawData?.overallRecommendation;

  const handleCoursePress = (course: UICourse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openCourse(course, (message) => setLinkError(message));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Career Roadmap</Text>
            <Text style={styles.headerSub}>AI-Powered Career Counselor</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Domain insight pill */}
        {!isLoading && insight?.domain && (
          <View style={styles.domainPill}>
            <TrendingUp size={12} color='rgba(196,181,253,0.9)' />
            <Text style={styles.domainPillText} numberOfLines={1}>
              {insight.domain}
            </Text>
          </View>
        )}

        {/* Role selector */}
        {!isLoading && roles.length > 0 && (
          <View style={styles.roleSelector}>
            <Text style={styles.roleSelectorLabel}>Target Role</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roleChips}
            >
              {roles.map((r, i) => (
                <Pressable
                  key={r.label}
                  style={[
                    styles.roleChip,
                    selectedRole === i && styles.roleChipActive,
                  ]}
                  onPress={() => {
                    setSelectedRole(i);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      selectedRole === i && styles.roleChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text
                    style={[
                      styles.roleChipMatch,
                      selectedRole === i && styles.roleChipMatchActive,
                    ]}
                  >
                    {r.match}%
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </LinearGradient>

      {/* ── States ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View
          style={[styles.centerContent, { backgroundColor: colors.background }]}
        >
          <ActivityIndicator size='large' color='#7c3aed' />
          <Text
            style={[
              styles.loadingText,
              { color: colors.mutedForeground, marginTop: 12 },
            ]}
          >
            Loading your career roadmap…
          </Text>
        </View>
      ) : error ? (
        <View
          style={[styles.centerContent, { backgroundColor: colors.background }]}
        >
          <AlertCircle size={40} color='#ef4444' />
          <Text
            style={[styles.loadingText, { color: '#ef4444', marginTop: 12 }]}
          >
            {error}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomInset + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Career insight summary ──────────────────────────────────────── */}
          {insight?.summary && (
            <View
              style={[styles.insightCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.insightHeader}>
                <View
                  style={[
                    styles.sectionIconWrap,
                    { backgroundColor: '#f0eeff' },
                  ]}
                >
                  <TrendingUp size={15} color='#7c3aed' />
                </View>
                <Text
                  style={[styles.insightTitle, { color: colors.foreground }]}
                >
                  Your Career Profile
                </Text>
              </View>
              <Text
                style={[styles.insightText, { color: colors.mutedForeground }]}
              >
                {insight.summary}
              </Text>
            </View>
          )}

          {/* ── Match card ──────────────────────────────────────────────────── */}
          <View style={[styles.matchCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.matchSummary, { color: colors.foreground }]}>
              You're{' '}
              <Text style={styles.matchPercent}>{currentMatch}% match</Text>{' '}
              {currentMatch >= targetMatch
                ? '— you meet the target!'
                : `— here's what to improve`}
            </Text>

            {/* Why this role */}
            {currentRole?.why && (
              <Text style={[styles.whyText, { color: colors.mutedForeground }]}>
                {currentRole.why}
              </Text>
            )}

            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <View>
                  <Text
                    style={[
                      styles.progLabelSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Current
                  </Text>
                  <Text style={[styles.progLabelVal, { color: '#7c3aed' }]}>
                    {currentMatch}%
                  </Text>
                </View>
                {gap > 0 && (
                  <View style={styles.progArrow}>
                    <ArrowRight size={16} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.progGapText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      +{gap}% needed
                    </Text>
                  </View>
                )}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.progLabelSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Target
                  </Text>
                  <Text style={[styles.progLabelVal, { color: '#10b981' }]}>
                    {targetMatch}%
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(currentMatch, 100)}%` as any },
                  ]}
                />
                <View
                  style={[
                    styles.targetMarker,
                    { left: `${targetMatch}%` as any },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* ── Missing Skills for selected role ────────────────────────────── */}
          {currentRole && currentRole.missingSkills.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <View
                  style={[
                    styles.sectionIconWrap,
                    { backgroundColor: '#fef2f2' },
                  ]}
                >
                  <AlertCircle size={16} color='#ef4444' />
                </View>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Skills to Develop
                </Text>
              </View>

              <View style={styles.missingSkillsWrap}>
                {currentRole.missingSkills.map((s) => {
                  const pc = priorityColors(s.priority);
                  return (
                    <View
                      key={s.skill}
                      style={[
                        styles.missingSkill,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <View
                        style={[
                          styles.missingSkillPriority,
                          { backgroundColor: pc.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.missingSkillPriorityText,
                            { color: pc.color },
                          ]}
                        >
                          {s.priority}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.missingSkillName,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={3}
                      >
                        {s.skill}
                      </Text>
                      {s.coursesAvailable > 0 && (
                        <Text
                          style={[
                            styles.missingSkillCourses,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {s.coursesAvailable} course
                          {s.coursesAvailable !== 1 ? 's' : ''} available
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Recommended Courses ─────────────────────────────────────────── */}
          {displayCourses.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <View
                  style={[
                    styles.sectionIconWrap,
                    { backgroundColor: '#f0eeff' },
                  ]}
                >
                  <BookOpen size={16} color='#7c3aed' />
                </View>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Recommended Courses
                </Text>
              </View>

              <View style={styles.coursesList}>
                {displayCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    activeOpacity={0.85}
                    style={[
                      styles.courseCard,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() => handleCoursePress(course)}
                  >
                    <View
                      style={[
                        styles.courseIcon,
                        { backgroundColor: course.bg },
                      ]}
                    >
                      <BookOpen size={22} color={course.color} />
                    </View>
                    <View style={styles.courseMeta}>
                      <Text
                        style={[
                          styles.courseTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {course.title}
                      </Text>
                      <View style={styles.courseTags}>
                        <View style={styles.courseTag}>
                          <Laptop size={10} color={colors.mutedForeground} />
                          <Text
                            style={[
                              styles.courseTagText,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {course.platform}
                          </Text>
                        </View>
                        <View style={styles.courseTag}>
                          <Clock size={10} color={colors.mutedForeground} />
                          <Text
                            style={[
                              styles.courseTagText,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {course.duration}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.courseLevelTag,
                            { backgroundColor: course.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.courseLevelText,
                              { color: course.color },
                            ]}
                          >
                            {course.level}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.courseSkillTag,
                          { backgroundColor: '#f0eeff' },
                        ]}
                      >
                        <Text
                          style={styles.courseSkillTagText}
                          numberOfLines={1}
                        >
                          Fills: {course.skill}
                        </Text>
                      </View>
                    </View>
                    {/* Decorative — the whole card is the tap target */}
                    <View
                      style={[styles.startBtn, { backgroundColor: course.bg }]}
                    >
                      <ArrowRight size={14} color={course.color} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Overall recommendation / next step ─────────────────────────── */}
          {recommendation?.nextStep && (
            <View style={[styles.nextStepCard, { backgroundColor: '#f0eeff' }]}>
              <View style={styles.nextStepHeader}>
                <Rocket size={16} color='#7c3aed' />
                <Text style={styles.nextStepTitle}>Recommended Next Step</Text>
              </View>
              <Text style={styles.nextStepText}>{recommendation.nextStep}</Text>
            </View>
          )}

          {/* ── CTA ─────────────────────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.ctaBtn,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (displayCourses.length > 0) {
                openCourse(displayCourses[0], (message) =>
                  setLinkError(message),
                );
              }
            }}
          ></Pressable>
        </ScrollView>
      )}

      {/* ── Transient link-open error toast ─────────────────────────────────── */}
      {linkError && (
        <View style={[styles.toast, { bottom: bottomInset + 20 }]}>
          <AlertCircle size={14} color='#ffffff' />
          <Text style={styles.toastText}>{linkError}</Text>
        </View>
      )}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  headerSub: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.7)',
    fontFamily: 'Inter_400Regular',
  },
  domainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124,58,237,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  domainPillText: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.9)',
    fontFamily: 'Inter_500Medium',
    flexShrink: 1,
  },
  roleSelector: {},
  roleSelectorLabel: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.7)',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleChips: { gap: 8, paddingRight: 4 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roleChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  roleChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(196,181,253,0.8)',
  },
  roleChipTextActive: { color: '#ffffff' },
  roleChipMatch: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(196,181,253,0.5)',
  },
  roleChipMatchActive: { color: 'rgba(255,255,255,0.75)' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Insight card
  insightCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 10,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  insightText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  // Match card
  matchCard: {
    borderRadius: 18,
    padding: 18,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  matchSummary: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },
  matchPercent: { color: '#7c3aed', fontFamily: 'Inter_700Bold' },
  whyText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  progressSection: { gap: 10 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progLabelSub: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  progLabelVal: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  progArrow: { alignItems: 'center', gap: 2 },
  progGapText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    position: 'relative',
    overflow: 'visible',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 5,
  },
  targetMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 16,
    backgroundColor: '#10b981',
    borderRadius: 1,
  },

  // Section headings
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },

  // Missing skills
  missingSkillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  missingSkill: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  missingSkillPriority: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  missingSkillPriorityText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  missingSkillName: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    lineHeight: 17,
  },
  missingSkillCourses: { fontSize: 10, fontFamily: 'Inter_400Regular' },

  // Courses
  coursesList: { gap: 10 },
  courseCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  courseMeta: { flex: 1, gap: 6 },
  courseTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  courseTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  courseTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  courseTagText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  courseLevelTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  courseLevelText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  courseSkillTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  courseSkillTagText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#7c3aed',
  },
  startBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 0,
  },

  // Next step card
  nextStepCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  nextStepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextStepTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  nextStepText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#4c1d95',
    lineHeight: 20,
  },

  // CTA
  ctaBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  ctaText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#ffffff' },

  // States
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },

  // Toast (link-open error)
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
});
