# TrueCrimePodList - TODO

## Setup & Configuration
- [x] Update theme colors (warm charcoal, wine, emerald, taupe)
- [x] Update app name and branding in app.config.ts
- [x] Generate and set app icon/logo
- [x] Add all required icon mappings to icon-symbol.tsx

## Data Layer
- [x] Create data types/interfaces (Case, Podcast, FilterState)
- [x] Create mock dataset with 26 cases
- [x] Create filtering logic (filterCases function)
- [x] Create AsyncStorage persistence for filter state and saved cases

## Onboarding Flow
- [x] Welcome screen with brand intro
- [x] Vibe selection screen (category mood cards)
- [x] Boundary setup screen (content filter toggles)
- [x] Onboarding completion → navigate to main app

## Core Screens
- [x] Tab bar with 4 tabs (Explore, Lists, Saved, Settings)
- [x] Explore/Home screen with search, filter chips, case cards
- [x] Filter panel (slide-up) with all filter options
- [x] Case Detail screen with podcasts, badges, deep-links to Apple Podcasts + Spotify
- [x] Lists screen with curated editorial lists
- [x] Saved screen with saved cases list
- [x] Settings screen with boundary toggles and About section

## Key Components
- [x] CaseCard component (normal)
- [x] BlockedCaseCard component (blurred/locked)
- [x] RevealModal component (warning + confirm)
- [x] FilterPanel component (slide-up sheet)
- [x] FilterChips component (active filter pills)
- [x] BadgePill component (case and podcast badges)
- [x] PodcastRow component (within case detail)

## Safety & Filtering Logic
- [x] Default filters ON (child victim, familicide blocked)
- [x] Blocked-but-visible behavior (locked cards appear in results)
- [x] Per-case reveal state (not global)
- [x] Filter state persisted in AsyncStorage
- [x] Saved cases persisted in AsyncStorage

## Polish & Branding
- [x] Brand colors applied throughout (wine, charcoal, gold, emerald)
- [x] Card press animations (scale)
- [x] Smooth filter panel slide-up animation
- [x] TypeScript clean (0 errors)
- [x] App icon + splash screen set

## App Store Readiness
- [x] App icon (all sizes)
- [x] Splash screen
- [x] No placeholder content in production

## UX Research Improvements (v1.1)
- [x] Remove all em dashes (replace with commas, colons, or rewrite)
- [x] Haptics: 400ms notification for save action (positive reinforcement)
- [x] Haptics: 100ms subtle pulse for all button taps
- [x] Haptics: Medium impact for filter toggles and boundary switches
- [x] Haptics: Success notification for onboarding completion
- [x] Onboarding: Add progress bar (not just dots) to reduce early churn
- [x] Onboarding: Action-oriented CTA copy ("Start Exploring" not "Continue")
- [x] Explore screen: Add "New Updates" section at top (variable reward / Hook Model)
- [x] Micro-animations: Fade-in for case cards on load
- [x] Micro-animations: Heart icon pulse on save
- [x] Reduce cognitive load: Simplify filter panel labels
- [x] Case detail: Add "Start Here" highlight card at top of podcast list
- [x] Settings: Add haptics toggle (user autonomy per UX research)

## Onboarding Overhaul (v1.2)

- [x] 5-step onboarding: Welcome, Vibes, Boundaries, Confirm, Done
- [x] Browse With Boundaries gate per PDF spec (no defaults, no preselections)
- [x] "Browse All Cases" is a first-class option (selecting nothing is valid consent)
- [x] 3 boundary groups: People Involved, Case Resolution, Content Intensity
- [x] 9 boundary toggles total across all groups
- [x] Confirmation summary screen showing vibes and boundaries before entering app
- [x] "Edit Boundaries" back button on confirmation screen
- [x] FilterState expanded to include all 9 new boundary fields
- [x] DEFAULT_FILTER_STATE has all boundaries OFF (per PDF: no defaults)
- [x] filter-utils.ts updated to enforce all 9 boundaries
- [x] hasPsychManipulation field added to TruecrimeCase type and all mock data
- [x] Settings screen rebuilt with 3 boundary groups, live boundary count banner

## Settings: My Interests (v1.3)

- [x] Add My Interests section to Settings screen above My Boundaries
- [x] Show all vibe categories as toggleable cards (same style as onboarding)
- [x] Read selectedVibes from app context and allow toggling in-place
- [x] Persist updated vibe selections via app context (AsyncStorage)
- [x] Show active count badge on the section header

## Proactive Feature Sweep (v1.4)

- [ ] Add 4 more vibe categories: Small-Town Secrets, Courtroom Drama, Financial Crime, Cults and Manipulation (already exists, verify)
- [ ] Reset Boundaries button in Settings (clears all 9 toggles in one tap with haptic confirmation)
- [ ] Wire vibe selections to Explore screen: "Based on Your Interests" section at top when vibes are selected
- [ ] Share sheet on Case Detail (native iOS share sheet with case title and summary)
- [ ] Expand case database from 26 to 40+ cases (add 15+ new cases across crime types)
- [ ] What's New / Recent Developments tab or section (cases with recentDevelopments: true, sorted by date)
- [ ] Empty state screens for Saved (no saved cases yet) and Explore (no results match filters)
- [ ] "Start Here" pinned podcast on Case Detail (best-recommended podcast highlighted at top)
- [ ] Podcast tone filter on Case Detail (filter by Investigative, Narrative, Court-Focused)
- [ ] Add more vibe categories to onboarding to match expanded Settings list

## Reference Design Redesign (v1.5)
- [ ] CaseCard: full-width atmospheric image at top of card
- [ ] CaseCard: Verified Safe green badge when case matches user boundaries
- [ ] CaseCard: host name displayed on card
- [ ] CaseCard: hashtag-style pills
- [ ] CaseCard: View Details pill button
- [ ] Case Detail: full bleed hero image with vibe label overlay
- [ ] Case Detail: host name in wine/crimson color
- [ ] Case Detail: Why We Love It italic quote block
- [ ] Case Detail: Content Notes bullet section
- [ ] Case Detail: Perfect For pill row
- [ ] Case Detail: numbered episode list with first episode highlighted
- [ ] Home screen: large serif italic hero headline
- [ ] Home screen: two stacked CTAs (primary filled + secondary outlined)
- [ ] Home screen: Explore by Vibe as tall portrait image cards
- [ ] Add case cover images (curated atmospheric photos per case)

## Spec Compliance Audit (v1.6)

- [x] Filter panel: Format filter (Long-form season, Episodic)
- [x] Filter panel: Tone filter (Investigative, Narrative, Court-focused)
- [x] Filter panel: verify Case Status has all 4 options (Solved, Unsolved, Ongoing, Wrongful Conviction)
- [x] Filter panel: verify Crime Type has all 4 groups (Missing Person, Homicide, Serial, Financial/Cult/Corruption)
- [x] Filter panel: verify Era has all 5 options (Pre-1990, 1990s, 2000s, 2010s, Recent/Ongoing)
- [x] Filter panel: Exclude child-victim cases toggle (default ON)
- [x] Filter panel: Exclude familicide cases toggle (default ON)
- [x] Settings: Two default-ON safety toggles with clear explanations
- [x] Settings: About section present
- [x] Case Detail: podcast name, episode count, Apple Podcasts button, Spotify button all visible
- [x] Saved screen: blocked-but-visible behavior same as Explore
- [x] Explore: active filter chips shown below search bar
- [x] Explore: Filter button opens slide-up panel

## Visual Redesign v1.8

- [x] CaseCard: compact layout, small left thumbnail, no hashtags, category pill, serif title, bookmark icon, neumorphic surface
- [x] CaseCard: short 2-line spoiler-free description only
- [x] Case Detail: host name in wine/pink, pill tags (DEEP DIVE / COLD CASE style), no hashtags
- [x] Case Detail: Content Notes as collapsible dropdown (not always expanded)
- [x] Case Detail: "Start with these episodes" numbered list (case-forward, not podcast-forward)
- [x] About section: "A different kind of crime." hero headline
- [x] About section: revised manifesto copy (no sensationalism, women-centered)
- [x] About section: "Our Promise" numbered 01/02/03 list with accent colors
- [x] About section: "Curated by women, for women. Since 2024." footer
- [x] Remove all hashtag pills from every screen

## Backend Pipeline Phase 1-3

- [x] Database schema: cases, podcast_shows, podcast_episodes, case_shows, user_saved_cases, ingestion_log tables
- [x] Drizzle relations for all new tables
- [x] Seed 15 verified cases (Idaho 4, Gabby Petito, JonBenet, GSK, Laci Peterson, Casey Anthony, Amanda Knox, Gypsy Rose, Delphi, Maura Murray, Scott Peterson, BTK, Adnan Syed, Chris Watts, Elizabeth Holmes)
- [x] server/db.ts: all domain query helpers (cases, shows, episodes, saved, ingestion log)
- [x] server/podcast-ingestion.ts: iTunes search + RSS feed parser + DB persistence pipeline
- [x] server/routers.ts: cases, saved, and ingestion tRPC routes
- [x] lib/case-transformer.ts: DB row to TruecrimeCase app type converter
- [x] Explore screen: reads cases from tRPC/DB with MOCK_CASES fallback
- [ ] Saved screen: wire to tRPC saved router (currently still uses local AsyncStorage)
- [ ] Updates screen: wire to tRPC cases list filtered by recentDevelopments
- [ ] Run discoverAll ingestion to populate podcast shows and episodes for all 15 cases
- [ ] Phase 4: LLM extraction job (show notes to clean title, story position, content tags)

## v1.9 Sprint

- [x] Fix era mismatches across all cases (GSK, Unabomber corrected)
- [x] Remove coverageDepth from countActiveFilters (no UI for it)
- [x] Rebuild Explore screen: vibe strip first, search as header icon
- [x] Add hostType + banterLevel + primarySources fields to PodcastEntry type and mock data
- [x] Build episode filter strip on Case Detail (Start Here / Quick Catch-Up / Court Track / Low-Banter)
- [ ] Consolidate all enums into constants/enums.ts single source of truth (deferred)
- [ ] Move DV from hard filter to episode-level warning tag (deferred)

## v2.0 Episode Card Architecture

- [x] Select 5 high-coverage cases (Idaho 4, JonBenét, Laci Peterson, Gabby Petito, Delphi)
- [x] Fetch real episode data via Listen Notes API for all 5 cases
- [x] Update types.ts with full PodcastEpisodeCard protocol (ListenerFit, CoverageStyle, SourceTag, WarningTag, etc.)
- [x] Write curated featured-cases-data.ts with Why Listen / Strength / Watch Out / badges for all 5 cases
- [x] Rebuild Case Detail screen with two-layer architecture (Case Card + Episode Cards)
- [x] EpisodeCard: collapsible detail, listener fit badges, source tags, host type, warning tags, spoiler warnings
- [x] LegacyPodcastCard: fallback for non-featured cases
- [x] Wire Listen Notes API into ingestion pipeline (replaces iTunes-only search)
- [x] Add host filter chip to episode card strip (Female Host filter)
- [x] Cron scheduler for automatic 24-hour podcast refresh

## Functional Build Sprint (v2.1)

- [x] Pre-apply onboarded vibes on Explore first load (not "All Cases" default)
- [ ] Wire Saved screen to database via tRPC saved routes (not AsyncStorage-only)
- [x] Admin panel: web form to add/edit cases stored in database
- [x] Wire Listen Notes API into ingestion pipeline (replace iTunes-only search)
- [x] Cron scheduler: automatic 24-hour podcast refresh job
- [x] Female Host filter chip on Case Detail episode cards

## Live Episode Data + Sorting/Filtering (v2.2)

- [x] Add tRPC route: cases.getEpisodes (returns live episodes for a case with show metadata)
- [x] Wire Case Detail screen to live tRPC episode data (replace static featured-cases-data.ts)
- [x] Add sorting controls to Case Detail episode list (by length, date, podcast name)
- [x] Wire existing filter chips to live data (Start Here, Quick Catch-Up, Court Track, Low-Banter, Female Host)
- [x] Handle loading and empty states in Case Detail episode list

## Case Detail Redesign (v2.3)

- [x] Redesign Case Header: remove large hero image, add compact metadata row (year · location · type · status)
- [x] Add spoiler-safe case summary section
- [x] Replace Content Notes with "Before You Listen" section (case-level context only)
- [x] Rename section header to "Best episodes to start with" with subtitle
- [x] Redesign episode cards: Best For, Why Listen, Spoiler Risk, Content Style, Runtime, per-card warnings
- [x] Add per-card warning system (spoilers, 911 audio, courtroom audio, family interviews, etc.)
- [x] Redesign visual direction: dark charcoal bg, crisp card separation, muted gold accent only, more whitespace
- [x] Make Apple Podcasts and Spotify buttons equal weight
- [x] Replace bottom CTA text with "Compare all episodes for this case"

## Navigation Fix + Protocol Implementation (v2.4)

- [x] Fix back button: always visible, not floating/hidden behind image
- [x] Fix not-found state: proper back navigation, not a dead end
- [x] Fix "Case not found" bug: load case from DB via tRPC instead of MOCK_CASES
- [x] Fix FEATURED_CASES IDs to match database IDs (case_idaho4, case_jonbenet, etc.)
- [x] Implement episode grouping: Start Here / Deep Dives / Latest Updates / Primary Sources / Sensitive Coverage
- [x] Exact spoiler warning wording per protocol (not vague "spoiler level")
- [x] Badge limit: max 3-5 visible per card, warnings separate
- [x] Coverage highlights on case header (Best First Listen available, Family Interview available, etc.)

## Nav + Bookmark + Content Tags (v2.6)

- [ ] Improve back button visibility: larger tap target, label text "Cases", always in document flow
- [ ] Bookmark/save button: visible in nav bar with filled/unfilled state, haptic feedback, toast confirmation
- [ ] Saved cases tab: show saved cases list with remove option
- [ ] Replace episode count on podcast show cards with content-type tags (911 Call, Victim Interview, Courtroom Audio, Family Interview, Police Interview, Expert Analysis, etc.)
- [ ] Infer content tags from episode titles/descriptions using keyword matching
