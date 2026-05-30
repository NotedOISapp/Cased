import type { TruecrimeCase, FilterState, FilteredResults } from './types';

// ============================================================
// Core Filtering Logic
// ============================================================

/**
 * Determines if a case should be BLOCKED (shown as locked card).
 * Per the PDF: boundaries are user-driven, none are hardcoded.
 * Blocked cases still appear in results but require explicit reveal.
 */
export function isCaseBlocked(caseItem: TruecrimeCase, filters: FilterState): boolean {
  // People Involved boundaries
  if (filters.blockChildVictim && caseItem.hasChildVictim) return true;
  if (filters.blockFamilicide && caseItem.isFamilicide) return true;
  if (filters.blockSexualAssault && caseItem.hasSexualAssault) return true;
  if (filters.blockSuicide && caseItem.hasSuicide) return true;

  // Case Resolution boundaries
  if (filters.blockUnsolved && caseItem.caseStatus === 'Unsolved') return true;
  if (filters.blockOngoing && caseItem.caseStatus === 'Ongoing') return true;
  if (filters.blockDisputed && caseItem.caseStatus === 'WrongfulConviction') return true;

  // Content Intensity boundaries
  if (filters.blockGraphicDetail && caseItem.contentIntensity === 'GraphicDetails') return true;
  if (filters.blockDomesticViolence && caseItem.hasDomesticViolence) return true;
  if (filters.blockPsychManipulation && caseItem.hasPsychManipulation) return true;

  return false;
}

/**
 * Determines if a case matches the active browse filters (ignoring boundary blocks).
 */
export function doesCaseMatchFilters(caseItem: TruecrimeCase, filters: FilterState): boolean {
  // Search query
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase();
    const matchesTitle = caseItem.title.toLowerCase().includes(q);
    const matchesSummary = caseItem.summary.toLowerCase().includes(q);
    const matchesTags = caseItem.tags.some((t) => t.toLowerCase().includes(q));
    if (!matchesTitle && !matchesSummary && !matchesTags) return false;
  }

  // Case status filter
  if (filters.caseStatus.length > 0) {
    if (!filters.caseStatus.includes(caseItem.caseStatus)) return false;
  }

  // Crime type filter
  if (filters.crimeTypes.length > 0) {
    const hasMatch = caseItem.crimeTypes.some((ct) => filters.crimeTypes.includes(ct));
    if (!hasMatch) return false;
  }

  // Era filter
  if (filters.eras.length > 0) {
    if (!filters.eras.includes(caseItem.era)) return false;
  }

  // Content intensity filter
  if (filters.contentIntensity.length > 0) {
    if (!filters.contentIntensity.includes(caseItem.contentIntensity)) return false;
  }

  return true;
}

/**
 * Main filter function: returns both visible and blocked cases.
 * Blocked cases still appear in visibleCases (as locked cards).
 */
export function filterCases(cases: TruecrimeCase[], filters: FilterState): FilteredResults {
  const visibleCases: TruecrimeCase[] = [];
  const blockedCases: TruecrimeCase[] = [];

  for (const c of cases) {
    if (!doesCaseMatchFilters(c, filters)) continue;

    if (isCaseBlocked(c, filters)) {
      blockedCases.push(c);
      visibleCases.push(c); // Still included in list as locked card
    } else {
      visibleCases.push(c);
    }
  }

  return { visibleCases, blockedCases };
}

/**
 * Returns the set of blocked case IDs for quick lookup.
 */
export function getBlockedCaseIds(cases: TruecrimeCase[], filters: FilterState): Set<string> {
  const blocked = new Set<string>();
  for (const c of cases) {
    if (isCaseBlocked(c, filters)) {
      blocked.add(c.id);
    }
  }
  return blocked;
}

/**
 * Count active browse filters (not boundaries) for badge display.
 */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.caseStatus.length > 0) count++;
  if (filters.crimeTypes.length > 0) count++;
  if (filters.eras.length > 0) count++;
  if (filters.contentIntensity.length > 0) count++;
  if (filters.podcastTones.length > 0) count++;
  if (filters.podcastFormats.length > 0) count++;
  // coverageDepths intentionally excluded: no UI to set it, would create phantom filter count
  return count;
}

/**
 * Count active boundary toggles.
 */
export function countActiveBoundaries(filters: FilterState): number {
  const keys: (keyof FilterState)[] = [
    'blockChildVictim', 'blockFamilicide', 'blockSexualAssault', 'blockSuicide',
    'blockUnsolved', 'blockOngoing', 'blockDisputed',
    'blockGraphicDetail', 'blockDomesticViolence', 'blockPsychManipulation',
  ];
  return keys.filter((k) => filters[k] as boolean).length;
}

/**
 * Check if any browse filters are active (excluding boundaries and search).
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return countActiveFilters(filters) > 0 || filters.searchQuery.trim().length > 0;
}

/**
 * Clear all browse filters (preserves boundary settings).
 */
export function clearFilters(filters: FilterState): FilterState {
  return {
    ...filters,
    caseStatus: [],
    crimeTypes: [],
    eras: [],
    contentIntensity: [],
    podcastTones: [],
    podcastFormats: [],
    coverageDepths: [],
    searchQuery: '',
  };
}
