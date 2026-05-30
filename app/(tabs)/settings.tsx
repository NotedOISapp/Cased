import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { VIBE_CATEGORIES } from '@/lib/mock-data';
import type { FilterState } from '@/lib/types';
import { countActiveBoundaries } from '@/lib/filter-utils';

function triggerHaptic(type: 'light' | 'medium' = 'medium') {
  if (Platform.OS === 'web') return;
  if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// ============================================================
// Section Header
// ============================================================
function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {badge !== undefined && (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// Vibe Card (compact, for settings)
// ============================================================
function VibeCard({
  emoji,
  label,
  description,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.vibeCard, selected && styles.vibeCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.vibeCardTop}>
        <Text style={styles.vibeEmoji}>{emoji}</Text>
        {selected && (
          <View style={styles.vibeCheck}>
            <Text style={styles.vibeCheckText}>✓</Text>
          </View>
        )}
      </View>
      <Text style={[styles.vibeLabel, selected && styles.vibeLabelSelected]}>{label}</Text>
      <Text style={styles.vibeDesc}>{description}</Text>
    </TouchableOpacity>
  );
}

// ============================================================
// Toggle Row
// ============================================================
function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.toggleRow, value && styles.toggleRowActive]}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => {
          triggerHaptic('medium');
          onToggle();
        }}
        trackColor={{ false: '#3D3530', true: '#8B1A3A' }}
        thumbColor={value ? '#F5F0EB' : '#A89F96'}
      />
    </View>
  );
}

// ============================================================
// Boundary Group Card
// ============================================================
function BoundaryGroupCard({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: React.ReactNode[];
}) {
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
        <Text style={styles.groupDesc}>{description}</Text>
      </View>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={styles.divider} />}
          {row}
        </React.Fragment>
      ))}
    </View>
  );
}

// ============================================================
// Settings Screen
// ============================================================
export default function SettingsScreen() {
  const { state, setFilters, setVibes } = useApp();
  const { filters, selectedVibes } = state;

  function toggleFilter(key: keyof FilterState) {
    setFilters({ ...filters, [key]: !filters[key] });
  }

  function toggleVibe(id: string) {
    triggerHaptic('light');
    const next = selectedVibes.includes(id)
      ? selectedVibes.filter((v) => v !== id)
      : [...selectedVibes, id];
    setVibes(next);
  }

  const activeBoundaryCount = countActiveBoundaries(filters);
  const activeVibeCount = selectedVibes.length;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* -------------------------------------------------- */}
        {/* MY INTERESTS */}
        {/* -------------------------------------------------- */}
        <SectionHeader
          title="My Interests"
          badge={activeVibeCount === 0 ? 'All' : `${activeVibeCount} selected`}
        />
        <Text style={styles.sectionDesc}>
          Pick the types of cases you gravitate toward. This shapes your recommendations on the Explore screen.
        </Text>

        <View style={styles.vibesGrid}>
          {VIBE_CATEGORIES.map((vibe) => (
            <VibeCard
              key={vibe.id}
              emoji={vibe.emoji}
              label={vibe.label}
              description={vibe.description}
              selected={selectedVibes.includes(vibe.id)}
              onPress={() => toggleVibe(vibe.id)}
            />
          ))}
        </View>

        {activeVibeCount === 0 && (
          <View style={styles.allVibesNote}>
            <Text style={styles.allVibesNoteText}>
              Nothing selected means you see all case types. Select interests to prioritize specific categories.
            </Text>
          </View>
        )}

        {/* -------------------------------------------------- */}
        {/* MY BOUNDARIES */}
        {/* -------------------------------------------------- */}
        <SectionHeader
          title="My Boundaries"
          badge={activeBoundaryCount === 0 ? 'None' : `${activeBoundaryCount} active`}
        />
        <Text style={styles.sectionDesc}>
          These are not permanent. Change them anytime. Nothing is preselected by default.
        </Text>

        {/* Boundary Status Banner */}
        <View style={activeBoundaryCount > 0 ? styles.boundaryBanner : styles.boundaryBannerOpen}>
          <Text style={styles.boundaryBannerTitle}>
            {activeBoundaryCount === 0
              ? 'Browsing All Cases'
              : `${activeBoundaryCount} ${activeBoundaryCount === 1 ? 'Boundary' : 'Boundaries'} Active`}
          </Text>
          <Text style={styles.boundaryBannerSub}>
            {activeBoundaryCount === 0
              ? 'You are seeing everything. Toggle boundaries below to filter your browse.'
              : 'Cases matching your boundaries appear as locked cards. You can reveal them individually.'}
          </Text>
        </View>

        {/* People Involved */}
        <BoundaryGroupCard
          title="People Involved"
          description="Exclude cases based on who was harmed."
          rows={[
            <ToggleRow
              label="Child victims"
              description="Cases where the victim was under 18."
              value={filters.blockChildVictim}
              onToggle={() => toggleFilter('blockChildVictim')}
            />,
            <ToggleRow
              label="Familicide"
              description="A parent or guardian kills one or more family members."
              value={filters.blockFamilicide}
              onToggle={() => toggleFilter('blockFamilicide')}
            />,
            <ToggleRow
              label="Sexual assault"
              description="Cases where sexual assault is central to the story."
              value={filters.blockSexualAssault}
              onToggle={() => toggleFilter('blockSexualAssault')}
            />,
            <ToggleRow
              label="Suicide and murder-suicide"
              description="Cases where suicide is a central event."
              value={filters.blockSuicide}
              onToggle={() => toggleFilter('blockSuicide')}
            />,
          ]}
        />

        {/* Case Resolution */}
        <BoundaryGroupCard
          title="Case Resolution"
          description="Exclude cases based on how they ended."
          rows={[
            <ToggleRow
              label="Unsolved cases"
              description="Cases with no conviction or official closure."
              value={filters.blockUnsolved}
              onToggle={() => toggleFilter('blockUnsolved')}
            />,
            <ToggleRow
              label="Ongoing investigations"
              description="Cases still actively being investigated."
              value={filters.blockOngoing}
              onToggle={() => toggleFilter('blockOngoing')}
            />,
            <ToggleRow
              label="Disputed or appealed outcomes"
              description="Convictions that are strongly challenged or under appeal."
              value={filters.blockDisputed}
              onToggle={() => toggleFilter('blockDisputed')}
            />,
          ]}
        />

        {/* Content Intensity */}
        <BoundaryGroupCard
          title="Content Intensity"
          description="Exclude cases based on how they are presented."
          rows={[
            <ToggleRow
              label="Graphic detail"
              description="Episodes with explicit descriptions of violence or crime scenes."
              value={filters.blockGraphicDetail}
              onToggle={() => toggleFilter('blockGraphicDetail')}
            />,
            <ToggleRow
              label="Domestic violence"
              description="Cases where ongoing intimate-partner violence is central."
              value={filters.blockDomesticViolence}
              onToggle={() => toggleFilter('blockDomesticViolence')}
            />,
            <ToggleRow
              label="Psychological manipulation"
              description="Cases featuring coercive control, gaslighting, or cult dynamics."
              value={filters.blockPsychManipulation}
              onToggle={() => toggleFilter('blockPsychManipulation')}
            />,
          ]}
        />

        {/* Reset Boundaries */}
        {activeBoundaryCount > 0 && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              setFilters({
                ...filters,
                blockChildVictim: false,
                blockFamilicide: false,
                blockSexualAssault: false,
                blockSuicide: false,
                blockUnsolved: false,
                blockOngoing: false,
                blockDisputed: false,
                blockGraphicDetail: false,
                blockDomesticViolence: false,
                blockPsychManipulation: false,
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.resetBtnText}>Clear All Boundaries</Text>
            <Text style={styles.resetBtnSub}>Browse all cases without restrictions</Text>
          </TouchableOpacity>
        )}

        {/* How Boundaries Work */}
        <SectionHeader title="How Boundaries Work" />
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Boundaries are invisible while browsing.</Text>
            {' '}Cases are shown as editorial cards, not incident reports. Your boundaries decide what enters the room before you start browsing.
          </Text>
          <View style={styles.infoDivider} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Locked cards</Text>
            {' '}still appear in your results. You are never hidden from a case, just protected from stumbling into it unexpectedly.
          </Text>
          <View style={styles.infoDivider} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Reveal per case</Text>
            {' '}by tapping the locked card. This only unlocks that single case. Your global settings stay the same.
          </Text>
        </View>

        {/* About / Our Promise */}
        <SectionHeader title="About" />
        <View style={styles.aboutCard}>
          {/* Hero headline */}
          <Text style={styles.aboutHero}>A different kind of crime.</Text>

          {/* Body */}
          <Text style={styles.aboutBody}>
            True crime can be a lot, especially for women. We're over shows that sensationalize harm, ignore context, or treat real people like plot twists.
          </Text>

          {/* Our Promise */}
          <View style={styles.promiseSection}>
            <Text style={styles.promiseTitle}>Our Promise</Text>

            <View style={styles.promiseRow}>
              <Text style={styles.promiseNum}>01</Text>
              <Text style={styles.promiseText}>We lead with the case, not the host. Every podcast is here because it serves the story.</Text>
            </View>

            <View style={styles.promiseRow}>
              <Text style={[styles.promiseNum, styles.promiseNumGreen]}>02</Text>
              <Text style={styles.promiseText}>No spoilers. Ever. We believe you deserve to experience the story for yourself.</Text>
            </View>

            <View style={styles.promiseRow}>
              <Text style={styles.promiseNum}>03</Text>
              <Text style={styles.promiseText}>Your boundaries are real. Filter by what you can handle, not what the algorithm decides.</Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.aboutFooter}>Curated by women, for women. Since 2024.</Text>
        </View>

        {/* Curator Tools */}
        <SectionHeader title="Curator Tools" />
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/admin');
          }}
          activeOpacity={0.8}
        >
          <View style={styles.adminBtnInner}>
            <Text style={styles.adminBtnIcon}>🗂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBtnTitle}>Case Admin Panel</Text>
              <Text style={styles.adminBtnSub}>Add cases, edit details, trigger podcast discovery</Text>
            </View>
            <Text style={styles.adminBtnChevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>TrueCrimePodList v2.0</Text>
          <Text style={styles.versionSub}>All data is stored locally on your device.</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F0EB',
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7D7570',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBadge: {
    backgroundColor: '#2A2420',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  sectionBadgeText: {
    fontSize: 11,
    color: '#C4A882',
    fontWeight: '600',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#A89F96',
    lineHeight: 19,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  // Vibes grid
  vibesGrid: {
    gap: 10,
  },
  vibeCard: {
    backgroundColor: '#2A2420',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#3D3530',
  },
  vibeCardSelected: {
    borderColor: '#8B1A3A',
    backgroundColor: '#2E1520',
  },
  vibeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  vibeEmoji: {
    fontSize: 24,
  },
  vibeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B1A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vibeCheckText: {
    color: '#F5F0EB',
    fontSize: 11,
    fontWeight: '700',
  },
  vibeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F0EB',
    marginBottom: 2,
  },
  vibeLabelSelected: {
    color: '#C4A882',
  },
  vibeDesc: {
    fontSize: 12,
    color: '#A89F96',
    lineHeight: 17,
  },
  allVibesNote: {
    backgroundColor: '#1E2A22',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A4030',
  },
  allVibesNoteText: {
    fontSize: 12,
    color: '#8AB5A0',
    lineHeight: 18,
    textAlign: 'center',
  },
  // Boundary banner
  boundaryBanner: {
    backgroundColor: '#2E1520',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#5A1020',
    gap: 4,
  },
  boundaryBannerOpen: {
    backgroundColor: '#1E2A22',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A4030',
    gap: 4,
  },
  boundaryBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F0EB',
  },
  boundaryBannerSub: {
    fontSize: 12,
    color: '#A89F96',
    lineHeight: 17,
  },
  // Group card
  groupCard: {
    backgroundColor: '#2A2420',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3D3530',
    overflow: 'hidden',
  },
  groupHeader: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3530',
    gap: 3,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4A882',
  },
  groupDesc: {
    fontSize: 12,
    color: '#7D7570',
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#3D3530',
    marginHorizontal: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  toggleRowActive: {
    backgroundColor: '#2E1520',
  },
  toggleText: {
    flex: 1,
    gap: 3,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F0EB',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#A89F96',
    lineHeight: 17,
  },
  infoCard: {
    backgroundColor: '#1E2A22',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A4030',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#2A4030',
    marginVertical: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#8AB5A0',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
    color: '#D4C9BE',
  },
  aboutCard: {
    backgroundColor: '#1E1A18',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2420',
    overflow: 'hidden',
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  aboutHero: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F5F0EB',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  aboutBody: {
    fontSize: 14,
    color: '#A89F96',
    lineHeight: 22,
  },
  promiseSection: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2420',
    paddingTop: 14,
  },
  promiseTitle: {
    fontSize: 10,
    color: '#7D7570',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promiseNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B1A3A',
    lineHeight: 22,
    width: 28,
    flexShrink: 0,
  },
  promiseNumGreen: {
    color: '#4ADE80',
  },
  promiseText: {
    fontSize: 13,
    color: '#C4B8AE',
    lineHeight: 20,
    flex: 1,
  },
  aboutFooter: {
    fontSize: 12,
    color: '#5A4F4A',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2A2420',
    paddingTop: 14,
    fontStyle: 'italic',
  },
  // Keep old text styles for compatibility
  aboutText: {
    fontSize: 14,
    color: '#A89F96',
    lineHeight: 21,
  },
  aboutTagline: {
    fontSize: 14,
    color: '#C4A882',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  versionRow: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  versionText: {
    fontSize: 13,
    color: '#7D7570',
    fontWeight: '500',
  },
  versionSub: {
    fontSize: 12,
    color: '#5A4F48',
  },
  resetBtn: {
    backgroundColor: '#2A1A1A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5A1020',
    gap: 4,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4506A',
  },
  resetBtnSub: {
    fontSize: 12,
    color: '#5A4F48',
  },
  adminBtn: {
    backgroundColor: '#2A2420',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3D3530',
    overflow: 'hidden',
  },
  adminBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  adminBtnIcon: {
    fontSize: 22,
  },
  adminBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F5F0EB',
    marginBottom: 2,
  },
  adminBtnSub: {
    fontSize: 12,
    color: '#A89F96',
  },
  adminBtnChevron: {
    fontSize: 22,
    color: '#7D7570',
  },
});
