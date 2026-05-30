import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type {
  FilterState,
  CaseStatus,
  CrimeType,
  CaseEra,
  ContentIntensity,
  PodcastTone,
  PodcastFormat,
} from '@/lib/types';
import { countActiveFilters, clearFilters } from '@/lib/filter-utils';
import { IconSymbol } from './ui/icon-symbol';

interface FilterPanelProps {
  visible: boolean;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

type MultiFilterKey = 'caseStatus' | 'crimeTypes' | 'eras' | 'contentIntensity' | 'podcastTones' | 'podcastFormats';

// ============================================================
// Filter options per spec
// ============================================================

const CASE_STATUSES: { value: CaseStatus; label: string }[] = [
  { value: 'Solved', label: 'Solved' },
  { value: 'Unsolved', label: 'Unsolved' },
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'WrongfulConviction', label: 'Wrongful Conviction' },
];

// Consolidated into 4 spec groups
const CRIME_TYPES: { value: CrimeType; label: string }[] = [
  { value: 'MissingPerson', label: 'Missing Person' },
  { value: 'Homicide', label: 'Homicide' },
  { value: 'SerialOffender', label: 'Serial Offender' },
  { value: 'Financial', label: 'Financial / Cult / Corruption' },
  { value: 'Cult', label: 'Cult' },
  { value: 'Fraud', label: 'Fraud' },
  { value: 'Corruption', label: 'Corruption' },
];

const ERAS: { value: CaseEra; label: string }[] = [
  { value: 'Pre1990', label: 'Pre-1990' },
  { value: '1990s', label: '1990s' },
  { value: '2000s', label: '2000s' },
  { value: '2010s', label: '2010s' },
  { value: 'Recent', label: 'Recent / Ongoing' },
];

const TONES: { value: PodcastTone; label: string }[] = [
  { value: 'Investigative', label: 'Investigative' },
  { value: 'Narrative', label: 'Narrative' },
  { value: 'CourtFocused', label: 'Court-Focused' },
  { value: 'InterviewBased', label: 'Interview-Based' },
];

const FORMATS: { value: PodcastFormat; label: string }[] = [
  { value: 'LongFormSeason', label: 'Long-Form Season' },
  { value: 'Episodic', label: 'Episodic' },
];

// ============================================================
// Chip group component
// ============================================================
function ChipGroup<T extends string>({
  label,
  sublabel,
  options,
  selected,
  onToggle,
}: {
  label: string;
  sublabel?: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (val: T) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {sublabel && <Text style={styles.sectionSublabel}>{sublabel}</Text>}
      </View>
      <View style={styles.chips}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(opt.value);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================
// Safety toggle row
// ============================================================
function SafetyToggle({
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
    <TouchableOpacity style={styles.safetyRow} onPress={onToggle} activeOpacity={0.85}>
      <View style={styles.safetyLeft}>
        <Text style={styles.safetyLabel}>{label}</Text>
        <Text style={styles.safetyDesc}>{description}</Text>
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// Main Filter Panel
// ============================================================
export function FilterPanel({ visible, filters, onApply, onClose }: FilterPanelProps) {
  const [local, setLocal] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);

  function toggleMulti<T extends string>(key: MultiFilterKey, val: T) {
    setLocal((prev) => {
      const arr = prev[key] as T[];
      const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
      return { ...prev, [key]: next };
    });
  }

  function toggleBoundary(key: keyof FilterState) {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const activeCount = countActiveFilters(local);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Filter Cases</Text>
                {activeCount > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLocal(clearFilters(local));
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Safety defaults section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <IconSymbol name="lock.fill" size={13} color="#C4A882" />
                    <Text style={[styles.sectionLabel, { color: '#C4A882' }]}>Safety Defaults</Text>
                  </View>
                  <Text style={styles.safetyIntro}>
                    These two filters are on by default. You can turn them off at any time.
                  </Text>
                  <SafetyToggle
                    label="Hide child-victim cases"
                    description="Cases where a child is a primary victim will appear as locked cards."
                    value={local.blockChildVictim}
                    onToggle={() => toggleBoundary('blockChildVictim')}
                  />
                  <SafetyToggle
                    label="Hide familicide cases"
                    description="Cases involving a perpetrator killing their own family members."
                    value={local.blockFamilicide}
                    onToggle={() => toggleBoundary('blockFamilicide')}
                  />
                </View>

                <View style={styles.divider} />

                {/* Case Status */}
                <ChipGroup
                  label="Case Status"
                  options={CASE_STATUSES}
                  selected={local.caseStatus}
                  onToggle={(v) => toggleMulti('caseStatus', v)}
                />

                {/* Crime Type */}
                <ChipGroup
                  label="Crime Type"
                  sublabel="Select one or more"
                  options={CRIME_TYPES}
                  selected={local.crimeTypes}
                  onToggle={(v) => toggleMulti('crimeTypes', v)}
                />

                {/* Era */}
                <ChipGroup
                  label="Era"
                  options={ERAS}
                  selected={local.eras}
                  onToggle={(v) => toggleMulti('eras', v)}
                />

                {/* Podcast Tone */}
                <ChipGroup
                  label="Podcast Tone"
                  sublabel="How the story is told"
                  options={TONES}
                  selected={local.podcastTones}
                  onToggle={(v) => toggleMulti('podcastTones', v)}
                />

                {/* Format */}
                <ChipGroup
                  label="Format"
                  sublabel="Episode structure"
                  options={FORMATS}
                  selected={local.podcastFormats}
                  onToggle={(v) => toggleMulti('podcastFormats', v)}
                />
              </ScrollView>

              {/* Apply */}
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onApply(local);
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.applyText}>
                  {activeCount > 0 ? `Apply ${activeCount} Filter${activeCount > 1 ? 's' : ''}` : 'Apply'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,13,12,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1917',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#3D3530',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3D3530',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F0EB',
  },
  clearText: {
    fontSize: 14,
    color: '#8B1A3A',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 24,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#3D3530',
    marginVertical: -4,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A89F96',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionSublabel: {
    fontSize: 12,
    color: '#7D7570',
    marginLeft: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#2A2420',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  chipActive: {
    backgroundColor: '#3D1520',
    borderColor: '#8B1A3A',
  },
  chipText: {
    fontSize: 13,
    color: '#A89F96',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#F5F0EB',
    fontWeight: '600',
  },
  // Safety toggles
  safetyIntro: {
    fontSize: 13,
    color: '#7D7570',
    lineHeight: 19,
    marginBottom: 4,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2420',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3D3530',
    gap: 12,
  },
  safetyLeft: {
    flex: 1,
    gap: 3,
  },
  safetyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F0EB',
  },
  safetyDesc: {
    fontSize: 12,
    color: '#7D7570',
    lineHeight: 17,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3D3530',
    justifyContent: 'center',
    paddingHorizontal: 3,
    flexShrink: 0,
  },
  toggleOn: {
    backgroundColor: '#8B1A3A',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A89F96',
  },
  toggleThumbOn: {
    backgroundColor: '#F5F0EB',
    alignSelf: 'flex-end',
  },
  applyBtn: {
    backgroundColor: '#8B1A3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  applyText: {
    color: '#F5F0EB',
    fontSize: 16,
    fontWeight: '700',
  },
});
