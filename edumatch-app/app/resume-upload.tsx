import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle,
  ChevronLeft,
  Code2,
  FileUp,
  GraduationCap,
  Lightbulb,
  School,
  Sparkles,
  Upload,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { fileService } from '@/api/services/fileService';
import { resumeService } from '@/api/services/resumeService';
import { healthService } from '@/api/services/healthService';

type Step = 'upload' | 'analyzing' | 'result';

const EXTRACTED_SKILLS = [
  'Python',
  'Machine Learning',
  'NLP',
  'TensorFlow',
  'Deep Learning',
  'Data Analysis',
  'Research Methods',
  'Scikit-learn',
];

const EDUCATION = [
  { degree: 'PhD Computer Science', uni: 'MIT', year: '2019' },
  { degree: 'MS Artificial Intelligence', uni: 'LUMS', year: '2015' },
];

type ResumeExperience = { role: string; place: string; period: string };
type ResumeEducation = { degree: string; uni: string; year: string };
type ResumeExtractedData = {
  skills: string[];
  education: ResumeEducation[];
  experience: ResumeExperience[];
  others: Record<string, any>;
};

const INITIAL_RESUME_DATA: ResumeExtractedData = {
  skills: [],
  education: [],
  experience: [],
  others: {},
};

const EXPERIENCE: ResumeExperience[] = [
  { role: 'Senior ML Engineer', place: 'ACME Corp', period: '2019 - Present' },
];

function normalizeTextArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value))
    return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

const safeObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const parseResumeData = (rawData: unknown): ResumeExtractedData => {
  const payload = (rawData as any)?.data ?? rawData;
  // If the AI returned plain resume text (Deepseek fallback), parse it heuristically
  const textCandidate =
    typeof payload === 'string'
      ? payload
      : typeof (payload as any)?.modelId === 'string'
        ? (payload as any).modelId
        : typeof (payload as any)?.text === 'string'
          ? (payload as any).text
          : typeof (payload as any)?.resume === 'string'
            ? (payload as any).resume
            : null;

  if (textCandidate) {
    const marker = 'Resume Text:';
    const idx = textCandidate.indexOf(marker);
    const text =
      idx >= 0
        ? textCandidate.slice(idx + marker.length).trim()
        : textCandidate;
    return parsePlainResumeText(text);
  }

  const skills = normalizeTextArray(
    (payload as any)?.skills ?? (payload as any)?.extractedSkills,
  );

  const educationRaw = (payload as any)?.education ?? (payload as any)?.schools;
  const education = Array.isArray(educationRaw)
    ? educationRaw.map((item) => {
        const entry = safeObject(item) as Record<string, any>;
        return {
          degree:
            entry.degree ?? entry.title ?? entry.degreeName ?? entry.name ?? '',
          uni: entry.uni ?? entry.organization ?? entry.school ?? '',
          year:
            entry.year ??
            entry.graduationYear ??
            entry.period ??
            entry.date ??
            '',
        };
      })
    : [];

  const experienceRaw =
    (payload as any)?.experience ??
    (payload as any)?.workHistory ??
    (payload as any)?.workExperience ??
    (payload as any)?.jobs;
  const experience = Array.isArray(experienceRaw)
    ? experienceRaw.map((item) => {
        const entry = safeObject(item) as Record<string, any>;
        return {
          role: entry.role ?? entry.title ?? entry.position ?? '',
          place: entry.place ?? entry.company ?? entry.organization ?? '',
          period: entry.period ?? entry.duration ?? entry.date ?? '',
        };
      })
    : [];

  const others: Record<string, any> = {};
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const knownKeys = new Set([
      'skills',
      'extractedSkills',
      'education',
      'schools',
      'experience',
      'workHistory',
      'workExperience',
      'jobs',
      'data',
    ]);
    Object.entries(payload as Record<string, any>).forEach(([key, value]) => {
      if (!knownKeys.has(key)) {
        others[key] = value;
      }
    });
  }

  return {
    skills,
    education,
    experience,
    others,
  };
};

function parsePlainResumeText(text: string): ResumeExtractedData {
  const normalized = text.replace(/\r/g, '\n').replace(/•/g, '\n');
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract skills block (lines following 'SKILLS' heading) or comma lists
  let skills: string[] = [];
  const skillsIdx = lines.findIndex((l) => /^(skills[:\s]*$)/i.test(l));
  if (skillsIdx >= 0) {
    const windowLines = lines.slice(skillsIdx + 1, skillsIdx + 6).join(', ');
    skills = normalizeTextArray(windowLines);
  } else {
    // try to find a large list-like line containing many commas and known tech tokens
    const candidate = lines.find(
      (l) =>
        /\b(React|JavaScript|Python|Redux|Android|iOS|React Native)\b/i.test(
          l,
        ) && (l.match(/[,·/]/g) || []).length >= 1,
    );
    if (candidate) skills = normalizeTextArray(candidate);
  }

  // Experience: find lines with date ranges and pull surrounding context
  const experience: ResumeExperience[] = [];
  const dateRe =
    /(\d{1,2}\/\d{4}|\d{4})(\s*-\s*(Present|\d{1,2}\/\d{4}|\d{4}))?/i;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(dateRe);
    if (m) {
      const period = m[0];
      const prev = lines[i - 1] ?? '';
      const prev2 = lines[i - 2] ?? '';
      // Determine role and place heuristically
      let role = '';
      let place = '';
      if (/developer|engineer|intern|lead|manager|consultant/i.test(prev)) {
        role = prev;
        place = prev2;
      } else if (/developer|engineer|intern|lead|manager/i.test(prev2)) {
        role = prev2;
        place = prev;
      } else {
        // fallback: use nearby lines
        role = prev2 || prev || '';
        place = prev || '';
      }
      role = role.replace(/\b(Full-time|Part-time|Freelance)\b/i, '').trim();
      experience.push({
        role: role || 'Professional Experience',
        place: place || '',
        period,
      });
    }
  }

  // Projects: try to capture project name + period blocks (e.g., Alowaa \n 09/2023 - 08/2024)
  const projectsStart = lines.findIndex((l) => /^projects[:\s]*$/i.test(l));
  if (projectsStart >= 0) {
    for (
      let i = projectsStart + 1;
      i < Math.min(lines.length, projectsStart + 40);
      i++
    ) {
      const name = lines[i];
      const next = lines[i + 1] ?? '';
      if (next.match(dateRe)) {
        // treat as experience entry
        experience.push({
          role: name,
          place: '',
          period: next.match(dateRe)![0],
        });
      }
    }
  }

  // Education: look for 'Bachelor' or 'University' lines and capture nearby year
  const education: ResumeEducation[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (
      /\b(Bachelor|BSCS|B\.Sc|BSc|Bachelors|BS|BA)\b/i.test(l) ||
      /university/i.test(lines[i + 1] ?? '')
    ) {
      const degree = l;
      const uni = lines[i + 1] ?? '';
      const yearMatch = (l + ' ' + uni).match(/(20\d{2}|19\d{2}|\d{4})/);
      education.push({
        degree: degree.replace(/\s+GPA.*$/i, '').trim(),
        uni: uni.trim(),
        year: yearMatch ? yearMatch[0] : '',
      });
    }
  }

  // fallback: if none found, attempt to locate GPA/University line clusters
  if (education.length === 0) {
    const uniIdx = lines.findIndex((l) => /university/i.test(l));
    if (uniIdx >= 0) {
      const degree = lines[uniIdx - 1] ?? '';
      const uni = lines[uniIdx];
      const yearMatch = (degree + ' ' + uni).match(/(20\d{2}|19\d{2}|\d{4})/);
      education.push({
        degree: degree.trim(),
        uni: uni.trim(),
        year: yearMatch ? yearMatch[0] : '',
      });
    }
  }

  // contact extras
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const linkedinMatch = text.match(
    /(https?:\/\/)?(www\.)?linkedin\.com\/[^\s,]*/i,
  );
  const phoneMatch = text.match(/\+?\d[\d\s-]{7,}\d/);

  const others: Record<string, any> = {};
  if (emailMatch) others.email = emailMatch[0];
  if (linkedinMatch) others.linkedin = linkedinMatch[0];
  if (phoneMatch) others.phoneNumber = phoneMatch[0];
  others.rawText = text.slice(0, 4000);

  return { skills, education, experience, others };
}

export default function ResumeUploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateUser, updateUserLocally } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [progress, setProgress] = useState(0);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [resumeData, setResumeData] =
    useState<ResumeExtractedData>(INITIAL_RESUME_DATA);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (step === 'analyzing') {
      const spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      );
      spinLoopRef.current = spinAnimation;
      spinAnimation.start();

      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 18 + 8;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
        }
        setProgress(Math.min(prog, 100));
        Animated.timing(progressAnim, {
          toValue: prog / 100,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }, 500);

      return () => {
        clearInterval(interval);
        if (spinLoopRef.current) {
          spinLoopRef.current.stop();
          spinLoopRef.current = null;
        }
      };
    }
    return undefined;
  }, [step, progressAnim, spinAnim]);

  useEffect(() => {
    if (step === 'analyzing' && analysisDone && progress >= 100) {
      if (spinLoopRef.current) {
        spinLoopRef.current.stop();
        spinLoopRef.current = null;
      }
      const timeout = setTimeout(() => setStep('result'), 600);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [analysisDone, progress, step]);

  const handleUpload = async () => {
    console.log('CV upload fun call 1');
    try {
      setUploadError(null);

      const doc = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
      });
      console.log('Selected document:', doc);

      const pickedFile = (doc as any)?.assets?.[0] ?? (doc as any) ?? null;

      if (!pickedFile || pickedFile?.uri == null || (doc as any).canceled) {
        console.warn('Document pick was canceled or invalid');
        return;
      }

      console.log('Picked file details:', {
        name: pickedFile.name,
        size: pickedFile.size,
        mimeType: pickedFile.mimeType,
        uri: pickedFile.uri,
      });

      const formData = new FormData();
      const pdfBlob = {
        uri: pickedFile.uri,
        name: pickedFile.name ?? 'resume.pdf',
        type: pickedFile.mimeType ?? 'application/pdf',
      };

      console.log('Appending to FormData:', pdfBlob);
      formData.append('pdf', pdfBlob as any);
      console.log('Form Data constructed:', {
        _parts: (formData as any)._parts?.length ?? 'unknown',
      });

      setStep('analyzing');
      setAnalysisDone(false);
      setProgress(0);
      progressAnim.setValue(0);
      spinAnim.setValue(0);

      console.log('Starting PDF upload...');
      let uploadResp: any;
      try {
        uploadResp = await fileService.pdfUpload(formData);
        console.log('PDF upload successful:', uploadResp);
      } catch (uploadErr: any) {
        console.error('PDF upload failed:', {
          code: uploadErr.code,
          message: uploadErr.message,
          status: uploadErr.response?.status,
          data: uploadErr.response?.data,
          config: {
            url: uploadErr.config?.url,
            method: uploadErr.config?.method,
          },
        });

        // Show more specific error to user
        if (uploadErr.code === 'ERR_NETWORK') {
          setUploadError(
            'Network error during upload. This PDF file may be too large or have compatibility issues. Try a different PDF.',
          );
        } else {
          setUploadError(
            uploadErr.response?.data?.message ||
              `Upload failed: ${uploadErr.message}`,
          );
        }
        setStep('upload');
        return;
      }

      if (!uploadResp) {
        console.error('PDF upload returned empty response');
        setUploadError('Upload failed: Empty response from server');
        setStep('upload');
        return;
      }

      // Try fetching parsed resume data from backend endpoint after upload.
      let parsedFromApi = null;
      try {
        console.log('Fetching resume data from API...');
        const resumeResp = await resumeService.getResumeData();
        console.log('Resume data from API:', resumeResp);
        parsedFromApi = parseResumeData(resumeResp.data.resumeData);

        const matchScore = resumeResp?.data?.matchScore;
        if (matchScore != null) {
          updateUserLocally({ matchScore });
        }
      } catch (err: any) {
        console.warn(
          'resumeService.getResumeData failed:',
          err?.response?.data?.message || err?.message || 'Unknown error',
        );
      }

      const parsed = parsedFromApi ?? parseResumeData(uploadResp);
      setResumeData(parsed);
      setAnalysisDone(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to upload resume.';
      setUploadError(errorMessage);
      console.error('Resume upload error:', error);
      setStep('upload');
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const TASKS = [
    { label: 'Scanning document structure...', done: progress > 20 },
    { label: 'Extracting skills & experience...', done: progress > 50 },
    { label: 'Running semantic analysis...', done: progress > 75 },
    { label: 'Building your profile...', done: progress >= 100 },
  ];

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
            <Text style={styles.headerTitle}>Resume Upload</Text>
            <Text style={styles.headerSub}>AI-Powered Profile Builder</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.stepsRow}>
          {[
            { key: 'upload', label: 'Upload' },
            { key: 'analyzing', label: 'Analysis' },
            { key: 'result', label: 'Profile' },
          ].map((s, i) => {
            const completed =
              (s.key === 'upload' &&
                (step === 'analyzing' || step === 'result')) ||
              (s.key === 'analyzing' && step === 'result');
            const active = s.key === step;
            return (
              <React.Fragment key={s.key}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      (completed || active) && styles.stepCircleDone,
                    ]}
                  >
                    {completed ? (
                      <Check size={12} color='#fff' />
                    ) : (
                      <Text
                        style={[
                          styles.stepNum,
                          (completed || active) && styles.stepNumDone,
                        ]}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      (completed || active) && styles.stepLabelDone,
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
                {i < 2 && (
                  <View
                    style={[
                      styles.stepLine,
                      (step !== 'upload' && i === 0) ||
                      (step === 'result' && i === 1)
                        ? styles.stepLineDone
                        : {},
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </LinearGradient>

      {step === 'upload' && (
        <ScrollView
          contentContainerStyle={[
            styles.uploadContent,
            { paddingBottom: bottomInset + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.uploadZone,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <LinearGradient
              colors={['#f0eeff', '#ede9fe']}
              style={styles.uploadIconBg}
            >
              <Upload size={40} color='#7c3aed' />
            </LinearGradient>
            <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
              Upload Your Resume
            </Text>
            <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
              Supports PDF and DOCX formats{'\n'}up to 10MB
            </Text>
            <View style={styles.formatBadges}>
              {['PDF', 'DOCX'].map((f) => (
                <View key={f} style={styles.formatBadge}>
                  <Text style={styles.formatBadgeText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.uploadBtn,
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleUpload}
          >
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              style={styles.uploadBtnGradient}
            >
              <FileUp size={18} color='#fff' />
              <Text style={styles.uploadBtnText}>Select File</Text>
            </LinearGradient>
          </Pressable>
          {uploadError ? (
            <View
              style={[
                styles.errorRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <AlertCircle size={16} color='#ef4444' />
              <Text style={[styles.errorText, { color: '#ef4444' }]}>
                {uploadError}
              </Text>
            </View>
          ) : null}
          <View
            style={[
              styles.tip,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Lightbulb size={18} color='#f59e0b' />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
              AI will extract your skills, education, and experience
              automatically
            </Text>
          </View>
        </ScrollView>
      )}

      {step === 'analyzing' && (
        <View style={styles.analyzeContent}>
          <View style={styles.analyzeCard}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <LinearGradient
                colors={['#7c3aed', '#a855f7']}
                style={styles.spinnerGradient}
              >
                <Sparkles size={28} color='#fff' />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.analyzeTitle, { color: colors.foreground }]}>
              AI is Analyzing...
            </Text>
            <Text
              style={[styles.analyzeSub, { color: colors.mutedForeground }]}
            >
              Extracting skills, education, and experience from your resume
            </Text>
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
            <Text
              style={[styles.progressText, { color: colors.mutedForeground }]}
            >
              {Math.round(progress)}% complete
            </Text>
            {TASKS.map((task) => (
              <View key={task.label} style={styles.taskRow}>
                <View
                  style={[styles.taskDot, task.done && styles.taskDotDone]}
                />
                <Text
                  style={[
                    styles.taskText,
                    { color: task.done ? '#7c3aed' : colors.mutedForeground },
                  ]}
                >
                  {task.label}
                </Text>
                {task.done && <CheckCircle size={14} color='#10b981' />}
              </View>
            ))}
          </View>
        </View>
      )}

      {step === 'result' && (
        <ScrollView
          contentContainerStyle={[
            styles.resultContent,
            { paddingBottom: bottomInset + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.successBanner, { backgroundColor: '#f0fdf4' }]}>
            <CheckCircle size={22} color='#10b981' />
            <Text style={styles.successText}>
              Profile extracted successfully!
            </Text>
          </View>
          <View
            style={[styles.resultSection, { backgroundColor: colors.card }]}
          >
            <View style={styles.resultSectionHeader}>
              <Code2 size={16} color='#7c3aed' />
              <Text
                style={[
                  styles.resultSectionTitle,
                  { color: colors.foreground },
                ]}
              >
                Extracted Skills
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {resumeData.skills.length || EXTRACTED_SKILLS.length}
                </Text>
              </View>
            </View>
            <View style={styles.skillsWrap}>
              {(resumeData.skills.length
                ? resumeData.skills
                : EXTRACTED_SKILLS
              ).map((s) => (
                <View key={s} style={styles.skillPill}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
          <View
            style={[styles.resultSection, { backgroundColor: colors.card }]}
          >
            <View style={styles.resultSectionHeader}>
              <GraduationCap size={16} color='#3b82f6' />
              <Text
                style={[
                  styles.resultSectionTitle,
                  { color: colors.foreground },
                ]}
              >
                Education
              </Text>
            </View>
            {(resumeData.education.length
              ? resumeData.education
              : EDUCATION
            ).map((e) => (
              <View
                key={`${e.degree}-${e.uni}-${e.year}`}
                style={[styles.eduItem, { borderColor: colors.border }]}
              >
                <View style={[styles.eduIcon, { backgroundColor: '#eff6ff' }]}>
                  <School size={16} color='#3b82f6' />
                </View>
                <View>
                  <Text
                    style={[styles.eduDegree, { color: colors.foreground }]}
                  >
                    {e.degree}
                  </Text>
                  <Text
                    style={[styles.eduUni, { color: colors.mutedForeground }]}
                  >
                    {e.uni} · {e.year}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <View
            style={[styles.resultSection, { backgroundColor: colors.card }]}
          >
            <View style={styles.resultSectionHeader}>
              <Briefcase size={16} color='#10b981' />
              <Text
                style={[
                  styles.resultSectionTitle,
                  { color: colors.foreground },
                ]}
              >
                Experience
              </Text>
            </View>
            {(resumeData.experience.length
              ? resumeData.experience
              : EXPERIENCE
            ).map((e) => (
              <View
                key={`${e.role}-${e.place}-${e.period}`}
                style={[styles.eduItem, { borderColor: colors.border }]}
              >
                <View style={[styles.eduIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Briefcase size={16} color='#10b981' />
                </View>
                <View>
                  <Text
                    style={[styles.eduDegree, { color: colors.foreground }]}
                  >
                    {e.role}
                  </Text>
                  <Text
                    style={[styles.eduUni, { color: colors.mutedForeground }]}
                  >
                    {e.place} · {e.period}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          {Object.keys(resumeData.others).length > 0 && (
            <View
              style={[styles.resultSection, { backgroundColor: colors.card }]}
            >
              <View style={styles.resultSectionHeader}>
                <BookOpen size={16} color='#f97316' />
                <Text
                  style={[
                    styles.resultSectionTitle,
                    { color: colors.foreground },
                  ]}
                >
                  Other Resume Data
                </Text>
              </View>
              {Object.entries(resumeData.others).map(([key, value]) => (
                <View
                  key={key}
                  style={[styles.otherItem, { borderColor: colors.border }]}
                >
                  <Text
                    style={[styles.otherLabel, { color: colors.foreground }]}
                  >
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                  </Text>
                  <Text
                    style={[
                      styles.otherValue,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {typeof value === 'string'
                      ? value
                      : JSON.stringify(value, null, 2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && { opacity: 0.88 },
            ]}
            onPress={async () => {
              try {
                const payload = {
                  title: resumeData.others.title ?? undefined,
                  institution: resumeData.others.institution ?? undefined,
                  phoneNumber: resumeData.others.phoneNumber ?? undefined,
                  location: resumeData.others.location ?? undefined,
                  linkedinProfileLink:
                    resumeData.others.linkedinProfileLink ?? undefined,
                  personalWebsiteLink:
                    resumeData.others.personalWebsiteLink ?? undefined,
                  skills: resumeData.skills.length
                    ? resumeData.skills
                    : undefined,
                  professionalBio:
                    resumeData.others.professionalBio ?? undefined,
                  experience: resumeData.experience.length
                    ? resumeData.experience.map((entry) => ({
                        title: entry.role,
                        company: entry.place,
                        duration: entry.period,
                      }))
                    : undefined,
                  education: resumeData.education.length
                    ? resumeData.education
                    : undefined,
                  preferredRole: resumeData.others.preferredRole ?? undefined,
                  preferredType: resumeData.others.preferredType ?? undefined,
                  expectedSalary: resumeData.others.expectedSalary ?? undefined,
                  pdfUrl: resumeData.others.pdfUrl ?? undefined,
                };

                await updateUser(payload);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                router.replace('/edit-profile');
              } catch (error) {
                console.error('Failed to save profile:', error);
                setUploadError(
                  'Unable to save profile right now. Please try again.',
                );
              }
            }}
          >
            <LinearGradient
              colors={['#1e1b4b', '#2e1a6e']}
              style={styles.confirmGradient}
            >
              <CheckCircle size={18} color='#fff' />
              <Text style={styles.confirmText}>Confirm & Save Profile</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
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
  stepsRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(196,181,253,0.3)',
  },
  stepCircleDone: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  stepNum: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(196,181,253,0.7)',
  },
  stepNumDone: { color: '#ffffff' },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(196,181,253,0.6)',
  },
  stepLabelDone: { color: '#c4b5fd' },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(196,181,253,0.2)',
    marginBottom: 14,
  },
  stepLineDone: { backgroundColor: '#7c3aed' },
  uploadContent: { padding: 20, gap: 16 },
  uploadZone: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  uploadIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  uploadSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  formatBadges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  formatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f0eeff',
  },
  formatBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
  uploadBtn: { borderRadius: 16, overflow: 'hidden' },
  uploadBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  uploadBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  tip: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  otherItem: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  otherLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  otherValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  analyzeContent: { flex: 1, padding: 20, justifyContent: 'center' },
  analyzeCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 28,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  spinnerGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  analyzeSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 4 },
  progressText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  taskDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e0f8' },
  taskDotDone: { backgroundColor: '#7c3aed' },
  taskText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  resultContent: { padding: 16, gap: 12 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#10b981',
  },
  resultSection: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  resultSectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 },
  countBadge: {
    backgroundColor: '#f0eeff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#7c3aed',
  },
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
  eduItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  eduIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eduDegree: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  eduUni: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  confirmBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  confirmText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#ffffff' },
});
