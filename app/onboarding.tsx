import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Switch,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/lib/app-context';
import { VIBE_CATEGORIES } from '@/lib/mock-data';
import type { FilterState } from '@/lib/types';
import { DEFAULT_FILTER_STATE } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'welcome' | 'vibes' | 'boundaries' | 'confirm' | 'done';
const STEPS: Step[] = ['welcome', 'vibes', 'boundaries', 'confirm', 'done'];
const STEP_INDEX: Record<Step, number> = {
  welcome: 0,
  vibes: 1,
  boundaries: 2,
  confirm: 3,
  done: 4,
};

// Boundary definitions per the PDF spec
const PEOPLE_BOUNDARIES = [
  {
    key: 'blockChildVictim' as keyof FilterState,
    label: 'Child victims',
    description: 'Cases where the victim was under 18.',
  },
  {
    key: 'blockFamilicide' as keyof FilterState,
    label: 'Familicide',
    description: 'A parent or guardian kills one or more family members.',
  },
  {
    key: 'blockSexualAssault' as keyof FilterState,
    label: 'Sexual assault',
    description: 'Cases where sexual assault is central to the story.',
  },
  {
    key: 'blockSuicide' as keyof FilterState,
    label: 'Suicide and murder-suicide',
    description: 'Cases where suicide is a central event.',
  },
];

const RESOLUTION_BOUNDARIES = [
  {
    key: 'blockUnsolved' as keyof FilterState,
    label: 'Unsolved cases',
    description: 'Cases with no conviction or official closure.',
  },
  {
    key: 'blockOngoing' as keyof FilterState,
    label: 'Ongoing investigations',
    description: 'Cases still actively being investigated.',
  },
  {
    key: 'blockDisputed' as keyof FilterState,
    label: 'Disputed or appealed outcomes',
    description: 'Convictions that are strongly challenged or under appeal.',
  },
];

const INTENSITY_BOUNDARIES = [
  {
    key: 'blockGraphicDetail' as keyof FilterState,
    label: 'Graphic detail',
    description: 'Episodes with explicit descriptions of violence or crime scenes.',
  },
  {
    key: 'blockDomesticViolence' as keyof FilterState,
    label: 'Domestic violence',
    description: 'Cases where ongoing intimate-partner violence is central.',
  },
  {
    key: 'blockPsychManipulation' as keyof FilterState,
    label: 'Psychological manipulation',
    description: 'Cases featuring coercive control, gaslighting, or cult dynamics.',
  },
];

function triggerHaptic(type: 'light' | 'medium' | 'success') {
  if (Platform.OS === 'web') return;
  if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

// ============================================================
// Progress Bar
// ============================================================
function ProgressBar({ step }: { step: Step }) {
  const current = STEP_INDEX[step];
  const total = STEPS.length;
  // Don't show on welcome or done screens
  if (step === 'welcome' || step === 'done') return null;
  const progress = current / (total - 1);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>Step {current} of {total - 2}</Text>
    </View>
  );
}

// ============================================================
// Step 1: Welcome
// ============================================================
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🎙</Text>
        </View>
      </View>
      <Text style={styles.welcomeTitle}>Cased</Text>
      <Text style={styles.welcomeTagline}>Smart true crime for women{'\n'}who have heard it all.</Text>
      <Text style={styles.welcomeBody}>
        Find the right podcast for every case. Filtered by your boundaries, curated for your taste.
      </Text>
      <View style={styles.featureList}>
        <FeatureRow icon="🔍" text="Case-first discovery, not podcast-first" />
        <FeatureRow icon="🔒" text="You control what you see, every session" />
        <FeatureRow icon="🎧" text="Deep-links straight to Apple Podcasts and Spotify" />
      </View>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => {
          triggerHaptic('light');
          onNext();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Let's Get Started</Text>
      </TouchableOpacity>
      <Text style={styles.finePrint}>No account needed. Everything stays on your device.</Text>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ============================================================
// Step 2: Vibe Selection
// ============================================================
function VibesStep({
  selectedVibes,
  onToggle,
  onNext,
}: {
  selectedVibes: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What draws you in?</Text>
      <Text style={styles.stepSubtitle}>
        Pick the types of cases you gravitate toward. This shapes your recommendations. You can change this anytime.
      </Text>
      <ScrollView
        style={styles.vibesScroll}
        contentContainerStyle={styles.vibesGrid}
        showsVerticalScrollIndicator={false}
      >
        {VIBE_CATEGORIES.map((vibe) => {
          const selected = selectedVibes.includes(vibe.id);
          return (
            <TouchableOpacity
              key={vibe.id}
              style={[styles.vibeCard, selected && styles.vibeCardSelected]}
              onPress={() => {
                triggerHaptic('light');
                onToggle(vibe.id);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.vibeCardHeader}>
                <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                {selected && (
                  <View style={styles.vibeCheck}>
                    <Text style={styles.vibeCheckText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.vibeLabel, selected && styles.vibeLabelSelected]}>
                {vibe.label}
              </Text>
              <Text style={styles.vibeDesc}>{vibe.description}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => {
          triggerHaptic('light');
          onNext();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>
          {selectedVibes.length === 0 ? 'Skip, Show Me Everything' : `Next: Set Boundaries (${selectedVibes.length} selected)`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Step 3: Browse With Boundaries Gate
// ============================================================
function BoundariesStep({
  filters,
  onToggle,
  onNext,
}: {
  filters: FilterState;
  onToggle: (key: keyof FilterState) => void;
  onNext: () => void;
}) {
  const activeCount = [
    ...PEOPLE_BOUNDARIES,
    ...RESOLUTION_BOUNDARIES,
    ...INTENSITY_BOUNDARIES,
  ].filter((b) => filters[b.key] as boolean).length;

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How do you want to browse?</Text>
      <Text style={styles.stepSubtitle}>
        These are not permanent. You can change them anytime from Settings. Nothing is preselected. You decide.
      </Text>
      <ScrollView
        style={styles.boundaryScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.boundaryScrollContent}
      >
        <BoundaryGroup
          title="People Involved"
          description="Exclude cases based on who was harmed."
          boundaries={PEOPLE_BOUNDARIES}
          filters={filters}
          onToggle={onToggle}
        />
        <BoundaryGroup
          title="Case Resolution"
          description="Exclude cases based on how they ended."
          boundaries={RESOLUTION_BOUNDARIES}
          filters={filters}
          onToggle={onToggle}
        />
        <BoundaryGroup
          title="Content Intensity"
          description="Exclude cases based on how they are presented."
          boundaries={INTENSITY_BOUNDARIES}
          filters={filters}
          onToggle={onToggle}
        />
        <View style={styles.browseAllNote}>
          <Text style={styles.browseAllNoteText}>
            Selecting nothing is a valid choice. Tapping "Start Browsing" with nothing selected means you want to see everything.
          </Text>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => {
          triggerHaptic('light');
          onNext();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>
          {activeCount === 0 ? 'Browse All Cases' : `Browse with ${activeCount} ${activeCount === 1 ? 'Boundary' : 'Boundaries'}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function BoundaryGroup({
  title,
  description,
  boundaries,
  filters,
  onToggle,
}: {
  title: string;
  description: string;
  boundaries: Array<{ key: keyof FilterState; label: string; description: string }>;
  filters: FilterState;
  onToggle: (key: keyof FilterState) => void;
}) {
  return (
    <View style={styles.boundaryGroup}>
      <Text style={styles.boundaryGroupTitle}>{title}</Text>
      <Text style={styles.boundaryGroupDesc}>{description}</Text>
      {boundaries.map((b) => {
        const value = filters[b.key] as boolean;
        return (
          <View key={b.key} style={[styles.boundaryRow, value && styles.boundaryRowActive]}>
            <View style={styles.boundaryText}>
              <Text style={styles.boundaryLabel}>{b.label}</Text>
              <Text style={styles.boundaryDesc}>{b.description}</Text>
            </View>
            <Switch
              value={value}
              onValueChange={() => {
                triggerHaptic('medium');
                onToggle(b.key);
              }}
              trackColor={{ false: '#3D3530', true: '#8B1A3A' }}
              thumbColor={value ? '#F5F0EB' : '#A89F96'}
            />
          </View>
        );
      })}
    </View>
  );
}

// ============================================================
// Step 4: Confirmation Summary
// ============================================================
function ConfirmStep({
  filters,
  selectedVibes,
  onFinish,
  onBack,
}: {
  filters: FilterState;
  selectedVibes: string[];
  onFinish: () => void;
  onBack: () => void;
}) {
  const allBoundaries = [
    ...PEOPLE_BOUNDARIES,
    ...RESOLUTION_BOUNDARIES,
    ...INTENSITY_BOUNDARIES,
  ];
  const activeBoundaries = allBoundaries.filter((b) => filters[b.key] as boolean);
  const activeVibes = VIBE_CATEGORIES.filter((v) => selectedVibes.includes(v.id));
  const browseAll = activeBoundaries.length === 0;

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Here is your setup</Text>
      <Text style={styles.stepSubtitle}>
        This is how you will browse today. You can change everything from Settings at any time.
      </Text>
      <ScrollView
        style={styles.confirmScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.confirmScrollContent}
      >
        {/* Vibes summary */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmSectionTitle}>Your Interests</Text>
          {activeVibes.length === 0 ? (
            <Text style={styles.confirmNoneText}>All case types</Text>
          ) : (
            <View style={styles.confirmChips}>
              {activeVibes.map((v) => (
                <View key={v.id} style={styles.confirmChip}>
                  <Text style={styles.confirmChipText}>{v.emoji} {v.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Boundaries summary */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmSectionTitle}>Your Boundaries</Text>
          {browseAll ? (
            <View style={styles.browseAllBadge}>
              <Text style={styles.browseAllBadgeText}>Browse All Cases</Text>
              <Text style={styles.browseAllBadgeSubtext}>
                You chose to see everything. You can add boundaries anytime.
              </Text>
            </View>
          ) : (
            <View style={styles.confirmBoundaryList}>
              {activeBoundaries.map((b) => (
                <View key={b.key} style={styles.confirmBoundaryItem}>
                  <Text style={styles.confirmBoundaryDot}>•</Text>
                  <Text style={styles.confirmBoundaryText}>{b.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.confirmNote}>
          <Text style={styles.confirmNoteText}>
            Boundaries are invisible while you browse. Cases are shown as editorial cards, not incident reports.
          </Text>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.editBtnText}>Edit Boundaries</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => {
          triggerHaptic('success');
          onFinish();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Start Browsing</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Main Onboarding Component
// ============================================================
export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, setFilters } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleFilter = (key: keyof FilterState) => {
    setLocalFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinish = () => {
    setFilters(localFilters);
    completeOnboarding(selectedVibes);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ProgressBar step={step} />

      {step === 'welcome' && (
        <WelcomeStep onNext={() => setStep('vibes')} />
      )}
      {step === 'vibes' && (
        <VibesStep
          selectedVibes={selectedVibes}
          onToggle={toggleVibe}
          onNext={() => setStep('boundaries')}
        />
      )}
      {step === 'boundaries' && (
        <BoundariesStep
          filters={localFilters}
          onToggle={toggleFilter}
          onNext={() => setStep('confirm')}
        />
      )}
      {step === 'confirm' && (
        <ConfirmStep
          filters={localFilters}
          selectedVibes={selectedVibes}
          onFinish={handleFinish}
          onBack={() => setStep('boundaries')}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  progressContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#3D3530',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#8B1A3A',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: '#7D7570',
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  // Welcome
  logoArea: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2A2420',
    borderWidth: 2,
    borderColor: '#8B1A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#F5F0EB',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  welcomeTagline: {
    fontSize: 17,
    color: '#C4A882',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  welcomeBody: {
    fontSize: 14,
    color: '#A89F96',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  featureList: {
    gap: 12,
    marginBottom: 36,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2A2420',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#D4C9BE',
    flex: 1,
    lineHeight: 20,
  },
  // Steps
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F5F0EB',
    marginBottom: 8,
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#A89F96',
    lineHeight: 20,
    marginBottom: 20,
  },
  // Vibes
  vibesScroll: {
    flex: 1,
    marginBottom: 16,
  },
  vibesGrid: {
    gap: 10,
    paddingBottom: 8,
  },
  vibeCard: {
    backgroundColor: '#2A2420',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3D3530',
  },
  vibeCardSelected: {
    borderColor: '#8B1A3A',
    backgroundColor: '#2E1520',
  },
  vibeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  vibeEmoji: {
    fontSize: 26,
  },
  vibeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8B1A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vibeCheckText: {
    color: '#F5F0EB',
    fontSize: 12,
    fontWeight: '700',
  },
  vibeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F0EB',
    marginBottom: 3,
  },
  vibeLabelSelected: {
    color: '#C4A882',
  },
  vibeDesc: {
    fontSize: 12,
    color: '#A89F96',
    lineHeight: 17,
  },
  // Boundaries
  boundaryScroll: {
    flex: 1,
    marginBottom: 16,
  },
  boundaryScrollContent: {
    gap: 20,
    paddingBottom: 8,
  },
  boundaryGroup: {
    gap: 10,
  },
  boundaryGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C4A882',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  boundaryGroupDesc: {
    fontSize: 12,
    color: '#7D7570',
    lineHeight: 17,
    marginBottom: 4,
  },
  boundaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2420',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  boundaryRowActive: {
    borderColor: '#5A1020',
    backgroundColor: '#2E1520',
  },
  boundaryText: {
    flex: 1,
  },
  boundaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F0EB',
    marginBottom: 2,
  },
  boundaryDesc: {
    fontSize: 12,
    color: '#A89F96',
    lineHeight: 17,
  },
  browseAllNote: {
    backgroundColor: '#1E2A22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A4030',
  },
  browseAllNoteText: {
    fontSize: 13,
    color: '#8AB5A0',
    lineHeight: 19,
    textAlign: 'center',
  },
  // Confirm
  confirmScroll: {
    flex: 1,
    marginBottom: 16,
  },
  confirmScrollContent: {
    gap: 20,
    paddingBottom: 8,
  },
  confirmSection: {
    gap: 10,
  },
  confirmSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C4A882',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  confirmNoneText: {
    fontSize: 14,
    color: '#A89F96',
    fontStyle: 'italic',
  },
  confirmChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  confirmChip: {
    backgroundColor: '#2E1520',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#5A1020',
  },
  confirmChipText: {
    fontSize: 13,
    color: '#C4A882',
  },
  browseAllBadge: {
    backgroundColor: '#1E2A22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A4030',
    gap: 4,
  },
  browseAllBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8AB5A0',
  },
  browseAllBadgeSubtext: {
    fontSize: 13,
    color: '#6A9080',
    lineHeight: 18,
  },
  confirmBoundaryList: {
    gap: 8,
  },
  confirmBoundaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  confirmBoundaryDot: {
    fontSize: 14,
    color: '#8B1A3A',
    lineHeight: 20,
  },
  confirmBoundaryText: {
    fontSize: 14,
    color: '#D4C9BE',
    lineHeight: 20,
    flex: 1,
  },
  confirmNote: {
    backgroundColor: '#2A2420',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  confirmNoteText: {
    fontSize: 13,
    color: '#A89F96',
    lineHeight: 19,
    textAlign: 'center',
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: '#3D3530',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#A89F96',
    fontSize: 14,
    fontWeight: '600',
  },
  // Shared buttons
  primaryBtn: {
    backgroundColor: '#8B1A3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#F5F0EB',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  finePrint: {
    fontSize: 12,
    color: '#7D7570',
    textAlign: 'center',
    marginTop: 12,
  },
});
