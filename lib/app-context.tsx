import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FilterState } from './types';
import { DEFAULT_FILTER_STATE } from './types';

// ============================================================
// State Shape
// ============================================================

interface AppState {
  filters: FilterState;
  savedCaseIds: Set<string>;
  revealedCaseIds: Set<string>;
  onboardingComplete: boolean;
  selectedVibes: string[];
  isLoaded: boolean;
}

const INITIAL_STATE: AppState = {
  filters: DEFAULT_FILTER_STATE,
  savedCaseIds: new Set(),
  revealedCaseIds: new Set(),
  onboardingComplete: false,
  selectedVibes: [],
  isLoaded: false,
};

// ============================================================
// Actions
// ============================================================

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'TOGGLE_SAVE_CASE'; payload: string }
  | { type: 'REVEAL_CASE'; payload: string }
  | { type: 'COMPLETE_ONBOARDING'; payload: { vibes: string[] } }
  | { type: 'SET_VIBES'; payload: string[] }
  | { type: 'SET_SEARCH'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload, isLoaded: true };

    case 'SET_FILTERS':
      return { ...state, filters: action.payload };

    case 'TOGGLE_SAVE_CASE': {
      const next = new Set(state.savedCaseIds);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, savedCaseIds: next };
    }

    case 'REVEAL_CASE': {
      const next = new Set(state.revealedCaseIds);
      next.add(action.payload);
      return { ...state, revealedCaseIds: next };
    }

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        onboardingComplete: true,
        selectedVibes: action.payload.vibes,
      };

    case 'SET_VIBES':
      return { ...state, selectedVibes: action.payload };

    case 'SET_SEARCH':
      return {
        ...state,
        filters: { ...state.filters, searchQuery: action.payload },
      };

    default:
      return state;
  }
}

// ============================================================
// Storage Keys
// ============================================================

const STORAGE_KEYS = {
  filters: '@tcpl_filters',
  savedCases: '@tcpl_saved_cases',
  revealedCases: '@tcpl_revealed_cases',
  onboarding: '@tcpl_onboarding',
  vibes: '@tcpl_vibes',
};

// ============================================================
// Context
// ============================================================

interface AppContextValue {
  state: AppState;
  setFilters: (filters: FilterState) => void;
  toggleSaveCase: (caseId: string) => void;
  revealCase: (caseId: string) => void;
  completeOnboarding: (vibes: string[]) => void;
  setVibes: (vibes: string[]) => void;
  setSearch: (query: string) => void;
  isSaved: (caseId: string) => boolean;
  isRevealed: (caseId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Load persisted state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const [filtersRaw, savedRaw, revealedRaw, onboardingRaw, vibesRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.filters),
          AsyncStorage.getItem(STORAGE_KEYS.savedCases),
          AsyncStorage.getItem(STORAGE_KEYS.revealedCases),
          AsyncStorage.getItem(STORAGE_KEYS.onboarding),
          AsyncStorage.getItem(STORAGE_KEYS.vibes),
        ]);

        const payload: Partial<AppState> = {};

        if (filtersRaw) {
          // Merge with DEFAULT_FILTER_STATE so new fields added in later versions
          // (e.g. podcastFormats) are always present even in old persisted data
          payload.filters = { ...DEFAULT_FILTER_STATE, ...JSON.parse(filtersRaw) };
        }
        if (savedRaw) {
          payload.savedCaseIds = new Set(JSON.parse(savedRaw));
        }
        if (revealedRaw) {
          payload.revealedCaseIds = new Set(JSON.parse(revealedRaw));
        }
        if (onboardingRaw) {
          payload.onboardingComplete = JSON.parse(onboardingRaw);
        }
        if (vibesRaw) {
          payload.selectedVibes = JSON.parse(vibesRaw);
        }

        dispatch({ type: 'LOAD_STATE', payload });
      } catch {
        dispatch({ type: 'LOAD_STATE', payload: {} });
      }
    }
    loadState();
  }, []);

  // Persist filters
  useEffect(() => {
    if (!state.isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(state.filters)).catch(() => {});
  }, [state.filters, state.isLoaded]);

  // Persist saved cases
  useEffect(() => {
    if (!state.isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.savedCases,
      JSON.stringify([...state.savedCaseIds])
    ).catch(() => {});
  }, [state.savedCaseIds, state.isLoaded]);

  // Persist revealed cases
  useEffect(() => {
    if (!state.isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.revealedCases,
      JSON.stringify([...state.revealedCaseIds])
    ).catch(() => {});
  }, [state.revealedCaseIds, state.isLoaded]);

  // Persist onboarding
  useEffect(() => {
    if (!state.isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.onboarding,
      JSON.stringify(state.onboardingComplete)
    ).catch(() => {});
  }, [state.onboardingComplete, state.isLoaded]);

  const setFilters = useCallback((filters: FilterState) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const toggleSaveCase = useCallback((caseId: string) => {
    dispatch({ type: 'TOGGLE_SAVE_CASE', payload: caseId });
  }, []);

  const revealCase = useCallback((caseId: string) => {
    dispatch({ type: 'REVEAL_CASE', payload: caseId });
  }, []);

  const completeOnboarding = useCallback((vibes: string[]) => {
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: { vibes } });
    AsyncStorage.setItem(STORAGE_KEYS.vibes, JSON.stringify(vibes)).catch(() => {});
  }, []);

  const setVibes = useCallback((vibes: string[]) => {
    dispatch({ type: 'SET_VIBES', payload: vibes });
    AsyncStorage.setItem(STORAGE_KEYS.vibes, JSON.stringify(vibes)).catch(() => {});
  }, []);

  const setSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH', payload: query });
  }, []);

  const isSaved = useCallback(
    (caseId: string) => state.savedCaseIds.has(caseId),
    [state.savedCaseIds]
  );

  const isRevealed = useCallback(
    (caseId: string) => state.revealedCaseIds.has(caseId),
    [state.revealedCaseIds]
  );

  return (
    <AppContext.Provider
      value={{
        state,
        setFilters,
        toggleSaveCase,
        revealCase,
        completeOnboarding,
        setVibes,
        setSearch,
        isSaved,
        isRevealed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
