import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Building2,
  ChevronLeft,
  ExternalLink,
  Globe,
  Link2,
  MapPin,
  Phone,
  Users,
  Briefcase,
} from 'lucide-react-native';
import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function OrganisationDetailsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  // ─── Detail rows config ───────────────────────────────────────────────────
  const companyDetails = [
    {
      label: 'Company Name',
      value: user?.companyName,
      Icon: Building2,
      iconColor: '#7c3aed',
      iconBg: '#f0eeff',
    },
    {
      label: 'Industry',
      value: user?.industry,
      Icon: Briefcase,
      iconColor: '#3b82f6',
      iconBg: '#eff6ff',
    },
    {
      label: 'Company Size',
      value: user?.companySize ? `${user.companySize} employees` : undefined,
      Icon: Users,
      iconColor: '#10b981',
      iconBg: '#f0fdf4',
    },
    {
      label: 'Location',
      value: user?.location,
      Icon: MapPin,
      iconColor: '#f59e0b',
      iconBg: '#fffbeb',
    },
    {
      label: 'Website',
      value: user?.companyWebsite,
      Icon: Globe,
      iconColor: '#0369a1',
      iconBg: '#f0f9ff',
      isLink: true,
    },
    {
      label: 'LinkedIn',
      value: user?.linkedinProfileLink,
      Icon: Link2,
      iconColor: '#7c3aed',
      iconBg: '#f0eeff',
      isLink: true,
    },
    {
      label: 'Phone',
      value: user?.phoneNumber,
      Icon: Phone,
      iconColor: '#10b981',
      iconBg: '#f0fdf4',
    },
  ].filter((item) => item.value);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
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
          <Text style={styles.headerTitle}>Organisation Details</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Company logo / profile image ── */}
        <View style={styles.logoWrap}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.logoImage} />
          ) : (
            <LinearGradient
              colors={['#7c3aed', '#6d28d9']}
              style={styles.logoIcon}
            >
              <Building2 size={32} color='#fff' />
            </LinearGradient>
          )}
          <Text style={styles.companyName}>
            {user?.companyName ?? 'Your Company'}
          </Text>
          {user?.industry ? (
            <Text style={styles.companyIndustry}>{user.industry}</Text>
          ) : null}
          {user?.designation ? (
            <View style={styles.designationBadge}>
              <Text style={styles.designationText}>{user.designation}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: bottomInset + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Company info — read only */}
        {companyDetails.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {companyDetails.map((item, index) => (
              <DetailRow
                key={item.label}
                label={item.label}
                value={item.value!}
                Icon={item.Icon}
                iconColor={item.iconColor}
                iconBg={item.iconBg}
                isLink={item.isLink}
                last={index === companyDetails.length - 1}
                colors={colors}
              />
            ))}
          </View>
        ) : (
          /* Empty state */
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Building2 size={40} color='#c4b5fd' />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No company details yet
            </Text>
            <Text
              style={[styles.emptySubText, { color: colors.mutedForeground }]}
            >
              Add your company information from the Edit Profile screen
            </Text>
            <TouchableOpacity
              style={styles.editNowBtn}
              onPress={() => router.push('/edit-profile')}
            >
              <LinearGradient
                colors={['#7c3aed', '#6d28d9']}
                style={styles.editNowGrad}
              >
                <Text style={styles.editNowText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Bio section */}
        {user?.professionalBio ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.bioLabel, { color: colors.mutedForeground }]}>
              ABOUT
            </Text>
            <Text style={[styles.bioText, { color: colors.foreground }]}>
              {user.professionalBio}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({
  label,
  value,
  Icon,
  iconColor,
  iconBg,
  isLink,
  last,
  colors,
}: {
  label: string;
  value: string;
  Icon: any;
  iconColor: string;
  iconBg: string;
  isLink?: boolean;
  last?: boolean;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.detailIcon, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={styles.detailContent}>
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text
          style={[
            styles.detailValue,
            { color: isLink ? '#7c3aed' : colors.foreground },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {isLink && <ExternalLink size={14} color='#7c3aed' />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: 'hidden',
  },
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
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },

  // Logo section
  logoWrap: { alignItems: 'center', gap: 10 },

  // Profile image (circular)
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },

  // Fallback gradient icon (rounded square)
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },

  companyName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  companyIndustry: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(196,181,253,0.8)',
    textAlign: 'center',
  },
  designationBadge: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  designationText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#c4b5fd',
  },

  // Body
  body: { padding: 16, gap: 12 },

  // Card
  card: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  // Detail row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: { flex: 1 },
  detailLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },

  // Bio
  bioLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },

  // Empty state
  emptyCard: {
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  editNowBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  editNowGrad: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  editNowText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
});
