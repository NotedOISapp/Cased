import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { CaseCard, BlockedCaseCard } from '@/components/case-card';
import { FilterPanel } from '@/components/filter-panel';
import { RevealModal } from '@/components/reveal-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/lib/app-context';
import { MOCK_CASES, VIBE_CATEGORIES } from '@/lib/mock-data';
import { filterCases, isCaseBlocked, countActiveFilters } from '@/lib/filter-utils';
import { trpc } from '@/lib/trpc';
import { dbCasesToAppCases } from '@/lib/case-transformer';
import type { TruecrimeCase } from '@/lib/types';

function triggerHaptic(type: 'light' | 'medium') {
  if (Platform.OS === 'web') return;
  if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// ============================================================
// Vibe Filter Strip — primary discovery entry point
// ============================================================
function VibeFilterStrip({
  selectedVibes,
  activeVibeFilter,
  onToggleVibe,
}: {
  selectedVibes: string[];
  activeVibeFilter: string | null;
  onToggleVibe: (vibeId: string) => void;
}) {
  // Show user's onboarded vibes first, then the rest
  const orderedVibes = useMemo(() => {
    const selected = VIBE_CATEGORIES.filter((v) => selectedVibes.includes(v.id));
    const rest = VIBE_CATEGORIES.filter((v) => !selectedVibes.includes(v.id));
    return [...selected, ...rest];
  }, [selectedVibes]);

  return (
    <View style={styles.vibeSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vibeScroll}
      >
        {/* "All" chip */}
        <TouchableOpacity
          style={[styles.vibeChip, activeVibeFilter === null && styles.vibeChipActive]}
          onPress={() => {
            triggerHaptic('light');
            onToggleVibe('__all__');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.vibeChipText, activeVibeFilter === null && styles.vibeChipTextActive]}>
            All Cases
          </Text>
        </TouchableOpacity>

        {orderedVibes.map((vibe) => {
          const isActive = activeVibeFilter === vibe.id;
          const isOnboarded = selectedVibes.includes(vibe.id);
          return (
            <TouchableOpacity
              key={vibe.id}
              style={[
                styles.vibeChip,
                isActive && styles.vibeChipActive,
                isOnboarded && !isActive && styles.vibeChipOnboarded,
              ]}
              onPress={() => {
                triggerHaptic('light');
                onToggleVibe(vibe.id);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
              <Text style={[styles.vibeChipText, isActive && styles.vibeChipTextActive]}>
                {vibe.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ============================================================
// New Developments Strip
// ============================================================
function NewUpdatesStrip({ cases }: { cases: TruecrimeCase[] }) {
  const router = useRouter();
  const recentCases = useMemo(() => cases.filter((c) => c.recentDevelopments).slice(0, 5), [cases]);
  if (recentCases.length === 0) return null;

  return (
    <View style={styles.updatesSection}>
      <View style={styles.updatesSectionHeader}>
        <View style={styles.updatesLiveDot} />
        <Text style={styles.updatesSectionTitle}>New Developments</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.updatesScroll}
      >
        {recentCases.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.updateCard}
            onPress={() => {
              triggerHaptic('light');
              router.push(`/case/${c.id}` as any);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.updateBadge}>
              <Text style={styles.updateBadgeText}>Updated</Text>
            </View>
            <Text style={styles.updateCardTitle} numberOfLines={2}>{c.title}</Text>
            {c.lastDevelopmentDate && (
              <Text style={styles.updateCardDate}>{c.lastDevelopmentDate}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================
// Active Filter Chips
// ============================================================
function ActiveFilterChips({
  filters,
  onClear,
}: {
  filters: ReturnType<typeof useApp>['state']['filters'];
  onClear: () => void;
}) {
  const chips: string[] = [];
  filters.caseStatus.forEach((s) => chips.push(s === 'WrongfulConviction' ? 'Wrongful Conv.' : s));
  filters.crimeTypes.forEach((c) =>
    chips.push(c === 'MissingPerson' ? 'Missing Person' : c === 'SerialOffender' ? 'Serial Offender' : c)
  );
  filters.eras.forEach((e) => chips.push(e === 'Pre1990' ? 'Pre-1990' : e === 'Recent' ? 'Recent' : e));
  filters.contentIntensity.forEach((i) =>
    chips.push(i === 'LightDiscussion' ? 'Light' : i === 'GraphicDetails' ? 'Graphic' : 'Court')
  );

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipsScroll}
      contentContainerStyle={styles.chipsContent}
    >
      {chips.map((chip, i) => (
        <View key={i} style={styles.activeChip}>
          <Text style={styles.activeChipText}>{chip}</Text>
        </View>
      ))}
      <TouchableOpacity
        style={styles.clearChip}
        onPress={() => {
          triggerHaptic('light');
          onClear();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.clearChipText}>Clear All</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============================================================
// Main Explore Screen
// ============================================================
export default function ExploreScreen() {
  const router = useRouter();
  const { state, setFilters, toggleSaveCase, isSaved, isRevealed, revealCase } = useApp();
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [revealTarget, setRevealTarget] = useState<TruecrimeCase | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  // Pre-apply the first onboarded vibe on first load so the user lands on curated content
  const initialVibe = state.selectedVibes && state.selectedVibes.length > 0 ? state.selectedVibes[0] : null;
  const [activeVibeFilter, setActiveVibeFilter] = useState<string | null>(initialVibe);
  const searchInputRef = useRef<TextInput>(null);

  // Fetch cases from DB via tRPC; fall back to MOCK_CASES while loading or on error
  const { data: dbCases, isLoading: casesLoading } = trpc.cases.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const allCases: TruecrimeCase[] = useMemo(() => {
    if (dbCases && dbCases.length > 0) return dbCasesToAppCases(dbCases);
    return MOCK_CASES;
  }, [dbCases]);

  // Apply vibe filter on top of the regular filter state
  const vibeFilteredCases = useMemo(() => {
    if (!activeVibeFilter) return allCases;
    const vibe = VIBE_CATEGORIES.find((v) => v.id === activeVibeFilter);
    if (!vibe) return allCases;
    return allCases.filter((c) => c.crimeTypes.some((ct) => vibe.crimeTypes.includes(ct)));
  }, [allCases, activeVibeFilter]);

  const { visibleCases } = useMemo(
    () => filterCases(vibeFilteredCases, state.filters),
    [vibeFilteredCases, state.filters]
  );

  const blockedIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of allCases) {
      if (isCaseBlocked(c, state.filters)) set.add(c.id);
    }
    return set;
  }, [allCases, state.filters]);

  const activeFilterCount = countActiveFilters(state.filters);
  const hasSearch = state.filters.searchQuery.length > 0;
  const showStrips = !hasSearch && activeFilterCount === 0 && !activeVibeFilter;

  const handleToggleVibe = useCallback((vibeId: string) => {
    if (vibeId === '__all__') {
      setActiveVibeFilter(null);
    } else {
      setActiveVibeFilter((prev) => (prev === vibeId ? null : vibeId));
    }
  }, []);

  const handleRevealRequest = useCallback((c: TruecrimeCase) => {
    setRevealTarget(c);
  }, []);

  const handleConfirmReveal = useCallback(() => {
    if (revealTarget) {
      revealCase(revealTarget.id);
      setRevealTarget(null);
    }
  }, [revealTarget, revealCase]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      ...state.filters,
      caseStatus: [],
      crimeTypes: [],
      eras: [],
      contentIntensity: [],
      podcastTones: [],
      coverageDepths: [],
      searchQuery: '',
    });
    setActiveVibeFilter(null);
  }, [state.filters, setFilters]);

  const handleToggleSearch = useCallback(() => {
    setSearchVisible((v) => {
      const next = !v;
      if (!next) {
        // Clear search when hiding
        setFilters({ ...state.filters, searchQuery: '' });
      } else {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return next;
    });
  }, [state.filters, setFilters]);

  const renderItem = useCallback(
    ({ item }: { item: TruecrimeCase }) => {
      const blocked = blockedIds.has(item.id) && !isRevealed(item.id);
      if (blocked) {
        return (
          <BlockedCaseCard
            caseItem={item}
            onReveal={() => {
              triggerHaptic('light');
              handleRevealRequest(item);
            }}
          />
        );
      }
      const isVerifiedSafe =
        !item.hasChildVictim &&
        !item.isFamilicide &&
        !item.hasSexualAssault &&
        !item.hasSuicide &&
        !item.hasDomesticViolence &&
        !item.hasPsychManipulation;
      return (
        <CaseCard
          caseItem={item}
          isSaved={isSaved(item.id)}
          onSave={() => {
            triggerHaptic('medium');
            toggleSaveCase(item.id);
          }}
          isVerifiedSafe={isVerifiedSafe}
        />
      );
    },
    [blockedIds, isRevealed, isSaved, toggleSaveCase, handleRevealRequest]
  );

  // Active vibe label for subtitle
  const activeVibeLabel = activeVibeFilter
    ? VIBE_CATEGORIES.find((v) => v.id === activeVibeFilter)?.label
    : null;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header — title + search icon + filter icon */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Cases</Text>
          {casesLoading ? (
            <ActivityIndicator size="small" color="#7D7570" style={{ marginLeft: 10 }} />
          ) : (
            <Text style={styles.headerSub}>
              {activeVibeLabel
                ? activeVibeLabel
                : `${visibleCases.length} case${visibleCases.length !== 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {/* Search icon */}
          <TouchableOpacity
            style={[styles.headerIconBtn, searchVisible && styles.headerIconBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              handleToggleSearch();
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="magnifyingglass"
              size={18}
              color={searchVisible ? '#F5F0EB' : '#A89F96'}
            />
          </TouchableOpacity>
          {/* Filter icon */}
          <TouchableOpacity
            style={[styles.headerIconBtn, activeFilterCount > 0 && styles.headerIconBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              setFilterPanelOpen(true);
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="slider.horizontal.3"
              size={18}
              color={activeFilterCount > 0 ? '#F5F0EB' : '#A89F96'}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar — only visible when toggled */}
      {searchVisible && (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <IconSymbol name="magnifyingglass" size={15} color="#7D7570" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search by case name, location..."
              placeholderTextColor="#7D7570"
              value={state.filters.searchQuery}
              onChangeText={(q) => setFilters({ ...state.filters, searchQuery: q })}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      )}

      {/* Vibe Filter Strip — primary discovery */}
      <VibeFilterStrip
        selectedVibes={state.selectedVibes}
        activeVibeFilter={activeVibeFilter}
        onToggleVibe={handleToggleVibe}
      />

      {/* Active filter chips */}
      <ActiveFilterChips filters={state.filters} onClear={handleClearFilters} />

      {/* New Developments strip — only when no active filters */}
      {showStrips && <NewUpdatesStrip cases={allCases} />}

      {/* Case list */}
      <FlatList
        data={visibleCases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No cases found</Text>
            <Text style={styles.emptyBody}>
              {activeVibeFilter
                ? 'No cases match this vibe with your current filters.'
                : 'Try adjusting your filters or search query.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => {
                triggerHaptic('light');
                handleClearFilters();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Filter Panel */}
      <FilterPanel
        visible={filterPanelOpen}
        filters={state.filters}
        onApply={setFilters}
        onClose={() => setFilterPanelOpen(false)}
      />

      {/* Reveal Modal */}
      <RevealModal
        visible={revealTarget !== null}
        caseItem={revealTarget}
        onReveal={handleConfirmReveal}
        onCancel={() => setRevealTarget(null)}
      />
    </ScreenContainer>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F0EB',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#7D7570',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2A2420',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  headerIconBtnActive: {
    backgroundColor: '#8B1A3A',
    borderColor: '#8B1A3A',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C4A882',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1C1917',
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2420',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#F5F0EB',
    padding: 0,
  },
  // Vibe strip
  vibeSection: {
    marginBottom: 10,
  },
  vibeScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2A2420',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  vibeChipOnboarded: {
    borderColor: '#4A3A28',
    backgroundColor: '#2E2820',
  },
  vibeChipActive: {
    backgroundColor: '#8B1A3A',
    borderColor: '#8B1A3A',
  },
  vibeEmoji: {
    fontSize: 14,
  },
  vibeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A89F96',
  },
  vibeChipTextActive: {
    color: '#F5F0EB',
    fontWeight: '600',
  },
  // Active filter chips
  chipsScroll: {
    marginBottom: 8,
  },
  chipsContent: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  activeChip: {
    backgroundColor: '#3D1520',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#8B1A3A',
  },
  activeChipText: {
    fontSize: 12,
    color: '#F5F0EB',
    fontWeight: '500',
  },
  clearChip: {
    backgroundColor: '#2A2420',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3D3530',
  },
  clearChipText: {
    fontSize: 12,
    color: '#A89F96',
    fontWeight: '500',
  },
  // New Developments strip
  updatesSection: {
    marginBottom: 16,
  },
  updatesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  updatesLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C4A882',
  },
  updatesSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C4A882',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  updatesScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  updateCard: {
    backgroundColor: '#2A2420',
    borderRadius: 14,
    padding: 14,
    width: 160,
    borderWidth: 1,
    borderColor: '#3D3530',
    borderLeftWidth: 3,
    borderLeftColor: '#C4A882',
  },
  updateBadge: {
    backgroundColor: '#3D3010',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  updateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4A882',
    letterSpacing: 0.5,
  },
  updateCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5F0EB',
    lineHeight: 18,
    marginBottom: 6,
  },
  updateCardDate: {
    fontSize: 11,
    color: '#7D7570',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F0EB',
  },
  emptyBody: {
    fontSize: 14,
    color: '#A89F96',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: '#2A2420',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#3D3530',
    marginTop: 8,
  },
  emptyBtnText: {
    color: '#C4A882',
    fontSize: 14,
    fontWeight: '600',
  },
});
