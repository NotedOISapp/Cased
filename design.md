# Cased - Design Document

## App Identity
**Name:** Cased  
**Tagline:** "Smart true crime for women who've heard it all."  
**Core Purpose:** A case-first true crime podcast discovery and filtering tool. Users find the right podcast for a specific case - not a player, a curator.  
**Target Audience:** Women who listen to true crime podcasts and want curated, boundary-aware recommendations.

---

## Brand & Visual Direction

### Overall Vibe
"A smart, stylish true crime best friend who does the research for you."  
Sophisticated, safe, intelligent, feminine - never gory, never shocking.

### Color Palette
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | `#1C1917` (warm charcoal) | `#0F0D0C` | Screen backgrounds |
| `surface` | `#2A2420` | `#1C1917` | Cards, panels |
| `foreground` | `#F5F0EB` | `#F5F0EB` | Primary text |
| `muted` | `#A89F96` | `#7D7570` | Secondary text |
| `primary` | `#8B1A3A` (deep wine) | `#A8214A` | CTAs, accents |
| `accent` | `#1D6B4E` (emerald) | `#26875F` | Tags, highlights |
| `border` | `#3D3530` | `#2A2420` | Dividers |
| `sand` | `#C4A882` | `#A8906E` | Warm taupe accent |

### Typography
- **Headings:** Playfair Display (elegant serif) - bold, generous size
- **Body:** System font (SF Pro on iOS) - clean, legible
- **Tags/Chips:** System font, medium weight, uppercase small

### Imagery & Icons
- Abstract shapes, gradients, subtle grain
- Waveform lines, magnifying glass silhouettes, case file motifs
- NO blood, weapons, crime scene tape, or horror imagery
- Diverse women in any illustrations/avatars

---

## Screen List

### 1. Onboarding (3 screens)
- **Welcome** - Brand intro, tagline, CTA to get started
- **Vibe Selection** - Pick your true crime mood categories (swipeable cards)
- **Boundary Setup** - Set content filters (child victims, familicide ON by default; SA, suicide, graphic detail toggles)

### 2. Home / Explore
- Search bar (filters mock dataset)
- Active filter chips (horizontal scroll)
- "Filter" button opens slide-up filter panel
- Case cards grid: normal cards + locked/blurred blocked cards
- Category sections: "Editor's Picks", "Trending Cases", "Recently Added"

### 3. Case Detail
- Case title, short spoiler-free summary
- Case-level badges: Solved/Unsolved/Ongoing + story mechanic badges
- "Listen with care" collapsed section (no trauma labels in main view)
- Related Podcasts list (2-5 podcasts per case):
  - Podcast name, podcast-level badges (depth, duration, format)
  - Coverage context ("Includes recent updates" / "Pre-update coverage")
  - "Open in Apple Podcasts" and "Open in Spotify" deep-link buttons
- Save button (heart icon)

### 4. Saved / My List
- Saved cases list
- Same blocked-but-visible behavior as Explore
- Empty state with CTA

### 5. Settings
- **My Boundaries** section: toggles for all content filters with explanations
- **About** section: brand story, mission
- **Upgrade** placeholder (not wired)

---

## Key User Flows

### Flow 1: First Launch
Onboarding Welcome → Vibe Selection → Boundary Setup → Home

### Flow 2: Browse & Filter
Home → Tap "Filter" → Slide-up panel → Select filters → Filtered case list → Tap case card → Case Detail → Tap "Open in Apple Podcasts"

### Flow 3: Blocked Case Reveal
Browse → See blurred locked card → Tap card → Warning modal ("This case contains content you filtered out") → "Go Back" OR "Reveal This Case" → Card reveals (per-case only)

### Flow 4: Save a Case
Case Detail → Tap heart icon → Toast "Added to My List" → View in Saved tab

### Flow 5: Adjust Boundaries
Settings → My Boundaries → Toggle filter → Confirmation → Browse updates

---

## Filtering Architecture

### Layer 0: Safety Gates (Blocked-but-Visible)
These cases APPEAR as locked cards, never hidden entirely. User must explicitly click to reveal per-case.
- `hasChildVictim: true` - blocked by default, user can toggle OFF
- `isFamilicide: true` - blocked by default, user can toggle OFF

### Layer 1: Case-Level Filters
- **Case Status:** Solved | Unsolved | Ongoing | Wrongful Conviction
- **Crime Type:** Homicide | Missing Person | Serial Offender | Financial/Cult/Corruption
- **Era:** Pre-1990 | 1990s | 2000s | 2010s | Recent/Ongoing
- **Content Intensity:** Light Discussion | Graphic Details | Court-Focused

### Layer 2: Podcast-Level Filters
- **Format:** Long-form Season | Episodic Anthology
- **Tone:** Investigative | Narrative | Court-Focused | Interview-Based

---

## Data Model

### Case
```
id, title, summary, tags[], status, crimeTypes[], era, format, tone,
hasChildVictim, isFamilicide, hasSexualAssault, hasSuicide, hasDomesticViolence,
graphicDetailLevel, caseStatus (Solved/Unsolved/Ongoing/WrongfulConviction),
recentDevelopments (boolean), lastDevelopmentDate,
storyMechanics[] (ShockingTurns/RedHerrings/KeepsYouGuessing/NarrativeShifts),
podcasts[]
```

### Podcast (within Case)
```
podcastName, applePodcastsUrl, spotifyUrl, episodeCount,
coverageDepth (Overview/InDepth/Exhaustive),
timeCommitment (Under1Hr/1to3Hrs/3PlusHrs),
narrativeStyle (StraightRetelling/SlowBuild/EpisodeByEpisode),
coverageEndDate, includesRecentUpdates (boolean)
```

---

## Tab Bar (5 items)
1. **Explore** (home/search icon) - Main browse screen
2. **Lists** (list icon) - Curated editorial lists
3. **Saved** (bookmark icon) - User's saved cases
4. **Settings** (gear icon) - Boundaries & preferences
