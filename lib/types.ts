// ============================================================
// Cased - Core Data Types
// v2.0 — Full Case Card + Podcast Episode Card Protocol
// ============================================================

// ── Case-level types ─────────────────────────────────────────

export type CaseStatus =
  | 'Missing'
  | 'Murdered'
  | 'Unsolved'
  | 'Solved'
  | 'ColdCase'
  | 'PresumedMurder'
  | 'BodyNotRecovered'
  | 'TrialPending'
  | 'Conviction'
  | 'RecentUpdate'
  | 'Ongoing'
  | 'WrongfulConviction';

export type PrimaryCategory =
  | 'Murdered'
  | 'Missing'
  | 'PresumedMurder'
  | 'SuspiciousDeath'
  | 'SerialCase'
  | 'WrongfulConvictionClaim';

export type CrimeType =
  | 'Homicide'
  | 'MissingPerson'
  | 'SerialOffender'
  | 'Financial'
  | 'Cult'
  | 'Corruption'
  | 'Kidnapping'
  | 'Fraud';

export type CaseEra = 'Pre1990' | '1990s' | '2000s' | '2010s' | 'Recent';

export type ContentIntensity = 'LightDiscussion' | 'GraphicDetails' | 'CourtFocused';

export type StoryMechanic =
  | 'ShockingTurns'
  | 'RedHerrings'
  | 'KeepsYouGuessing'
  | 'NarrativeShifts'
  | 'FemaleDetective'
  | 'WrongfulConviction'
  | 'MediaCircus'
  | 'ColdCaseRevived';

// ── Episode card types ────────────────────────────────────────

/** Which listener this episode is best for */
export type ListenerFit =
  | 'BestFirstListen'
  | 'BestDeepDive'
  | 'BestShortOverview'
  | 'BestUpdate'
  | 'BestTimeline'
  | 'BestVictimBackground'
  | 'BestEvidenceBreakdown'
  | 'BestLegalBreakdown'
  | 'BestLocalContext'
  | 'BestFamilyPerspective'
  | 'BetterAsFollowUp'
  | 'ForExperiencedListeners';

/** Coverage style / format of the episode */
export type CoverageStyle =
  | 'Narrative'
  | 'Conversational'
  | 'Documentary'
  | 'Investigative'
  | 'InterviewBased'
  | 'HostCommentary'
  | 'TimelineFocused'
  | 'CasefileStyle'
  | 'MultiPart'
  | 'SingleEpisode'
  | 'MiniSeries'
  | 'CourtFocused'
  | 'EvidenceFocused'
  | 'LocalReporting';

/** Primary source types present in the episode */
export type SourceTag =
  | 'FamilyInterview'
  | 'SurvivorInterview'
  | 'DetectiveInterview'
  | 'ProsecutorInterview'
  | 'DefenseInterview'
  | '911Audio'
  | 'CourtAudio'
  | 'TrialTestimony'
  | 'PoliceRecords'
  | 'InterrogationAudio'
  | 'NewsClips'
  | 'LocalReporting'
  | 'PrimarySources'
  | 'BodycamAudio'
  | 'DispatchAudio';

/** Warning tags — disturbing production or content */
export type WarningTag =
  | 'DescriptionContainsSpoilers'
  | 'TitleContainsSpoilers'
  | 'RevealsOutcomeEarly'
  | 'GraphicDetail'
  | 'DisturbingAudio'
  | 'DramaticSoundEffects'
  | 'ReenactmentAudio'
  | 'HeavyEmotionalContent'
  | 'ChildVictim'
  | 'DomesticViolence'
  | 'SexualViolence'
  | 'Dismemberment'
  | 'Stalking'
  | 'TortureCaptivity'
  | 'IntimatePartnerViolence'
  | 'NotForCasualListening'
  | 'HeadphonesCaution'
  | 'MayBeDisturbing'
  | 'ImmersiveStyle'
  | 'IntenseProduction';

/** Host type: who is behind the microphone */
export type HostType =
  | 'SoloFemale'
  | 'SoloMale'
  | 'FemaleDuo'
  | 'MixedDuo'
  | 'HusbandWife'
  | 'Network'
  | 'GuestHost';

/** Banter level: how much off-topic chat vs. content */
export type BanterLevel = 'Low' | 'Medium' | 'High';

// ── Podcast Episode Card ──────────────────────────────────────

/**
 * A single podcast episode covering a case.
 * This is the "Podcast Episode Card" — it does NOT repeat the case summary.
 * It answers: "Why should I listen to THIS podcast's version?"
 */
export interface PodcastEpisodeCard {
  // Identity
  podcastName: string;          // Show name, e.g. "Murder in America"
  episodeTitle: string;         // Actual episode title
  episodeId?: string;           // Listen Notes episode ID
  podcastId?: string;           // Listen Notes podcast ID

  // Metadata
  durationSec?: number;         // Raw seconds
  durationFormatted?: string;   // e.g. "52 min"
  releaseDate?: string;         // e.g. "March 14, 2023"
  podcastImage?: string;        // Show artwork URL
  episodeImage?: string;        // Episode artwork URL

  // Platform links
  applePodcastsUrl?: string;
  spotifyUrl?: string;
  listenNotesUrl?: string;
  podcastWebsiteUrl?: string;

  // App-written recommendation fields (curated by us)
  whyListen?: string;           // "Best for listeners who want..."
  strength?: string;            // What this episode does better than others
  watchOut?: string;            // What listeners may hate

  // Classification badges (show only top 1-3)
  listenerFit?: ListenerFit[];  // e.g. ['BestFirstListen']
  coverageStyle?: CoverageStyle[]; // e.g. ['Narrative', 'Investigative']
  sources?: SourceTag[];        // e.g. ['FamilyInterview', '911Audio']
  warnings?: WarningTag[];      // e.g. ['DramaticSoundEffects', 'GraphicDetail']

  // Host metadata
  hostType?: HostType;
  banterLevel?: BanterLevel;

  // Spoiler flags (specific, not vague)
  spoilerInDescription?: boolean;
  spoilerInTitle?: boolean;
  revealsOutcomeEarly?: boolean;
}

// ── Legacy PodcastEntry (kept for backward compat) ────────────

export type CoverageDepth = 'Overview' | 'InDepth' | 'Exhaustive';
export type TimeCommitment = 'Under1Hr' | '1to3Hrs' | '3PlusHrs';
export type NarrativeStyle = 'StraightRetelling' | 'SlowBuild' | 'EpisodeByEpisode' | 'Interview';
export type PodcastTone = 'Investigative' | 'Narrative' | 'CourtFocused' | 'InterviewBased';
export type PodcastFormat = 'LongFormSeason' | 'Episodic';

/** @deprecated Use PodcastEpisodeCard instead */
export interface PodcastEntry {
  podcastName: string;
  applePodcastsUrl: string;
  spotifyUrl: string;
  episodeCount: number;
  coverageDepth: CoverageDepth;
  timeCommitment: TimeCommitment;
  narrativeStyle: NarrativeStyle;
  tone: PodcastTone;
  format?: PodcastFormat;
  includesRecentUpdates: boolean;
  coverageEndDate?: string;
  startHereNote?: string;
  hostType?: HostType;
  banterLevel?: BanterLevel;
  primarySources?: string[];
}

// ── Case Card / Case Page ─────────────────────────────────────

/**
 * Available coverage highlights shown on the Case Card.
 * These summarize what types of episodes exist for this case.
 */
export type CoverageHighlight =
  | 'BestFirstListenAvailable'
  | 'DeepDiveAvailable'
  | 'FamilyInterviewAvailable'
  | 'PrimarySourcesAvailable'
  | 'RecentUpdateAvailable'
  | 'CourtCoverageAvailable'
  | 'LocalReportingAvailable'
  | 'ShortOverviewAvailable';

export interface TruecrimeCase {
  id: string;
  title: string;

  // Case Card required fields
  year?: number;                    // Year of the crime
  location?: string;                // City, State
  primaryCategory?: PrimaryCategory;
  summary: string;                  // Spoiler-safe, 2-4 sentences per protocol
  caseStatus: CaseStatus;
  crimeTypes: CrimeType[];
  era: CaseEra;
  contentIntensity: ContentIntensity;
  storyMechanics: StoryMechanic[];
  recentDevelopments: boolean;
  lastDevelopmentDate?: string;

  // Case Card display
  coverImage: string;
  tags: string[];
  coverageHighlights?: CoverageHighlight[];  // What types of coverage exist

  // Legacy fields (kept for existing cards)
  hostName?: string;
  whyWeLoveIt?: string;
  perfectFor?: string[];
  contentNotes?: string[];

  // Safety flags
  hasChildVictim: boolean;
  isFamilicide: boolean;
  hasSexualAssault: boolean;
  hasSuicide: boolean;
  hasDomesticViolence: boolean;
  hasPsychManipulation: boolean;

  // Podcast Episode Cards (new architecture)
  episodeCards?: PodcastEpisodeCard[];

  // Legacy podcasts (kept for backward compat)
  podcasts: PodcastEntry[];
}

// ── Filter State ──────────────────────────────────────────────

export interface FilterState {
  blockChildVictim: boolean;
  blockFamilicide: boolean;
  blockSexualAssault: boolean;
  blockSuicide: boolean;
  blockUnsolved: boolean;
  blockOngoing: boolean;
  blockDisputed: boolean;
  blockGraphicDetail: boolean;
  blockDomesticViolence: boolean;
  blockPsychManipulation: boolean;
  caseStatus: CaseStatus[];
  crimeTypes: CrimeType[];
  eras: CaseEra[];
  contentIntensity: ContentIntensity[];
  podcastTones: PodcastTone[];
  podcastFormats: PodcastFormat[];
  coverageDepths: CoverageDepth[];
  searchQuery: string;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  blockChildVictim: true,
  blockFamilicide: true,
  blockSexualAssault: false,
  blockSuicide: false,
  blockUnsolved: false,
  blockOngoing: false,
  blockDisputed: false,
  blockGraphicDetail: false,
  blockDomesticViolence: false,
  blockPsychManipulation: false,
  caseStatus: [],
  crimeTypes: [],
  eras: [],
  contentIntensity: [],
  podcastTones: [],
  podcastFormats: [],
  coverageDepths: [],
  searchQuery: '',
};

// ── UI Types ──────────────────────────────────────────────────

export interface FilteredResults {
  visibleCases: TruecrimeCase[];
  blockedCases: TruecrimeCase[];
}

export type OnboardingStep = 'welcome' | 'vibes' | 'boundaries' | 'done';

export interface VibeCategory {
  id: string;
  label: string;
  description: string;
  emoji: string;
  crimeTypes: CrimeType[];
}
