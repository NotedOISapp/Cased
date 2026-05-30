# Cased

Cased is a mood-first true crime podcast discovery app.

Instead of forcing users to browse endless podcast lists, Cased starts with how the listener feels:

- Chills
- Rabbit Hole
- Closure
- Quick Listen

From there, users choose a case, then see the different podcast coverage options for that case across Apple Podcasts, Spotify, and other verified podcast sources.

The core product flow is:

Mood
to Case
to Podcast Coverage
to Episode Preview or External Listen Link

## Project Status

This app is currently in launch recovery and production cleanup.

The immediate goal is to turn the existing prototype into a clean, TestFlight-ready Cased build with:

- Correct Cased branding
- Clean 4-tab navigation
- Mood-first discovery
- Real case data
- Live podcast coverage ingestion
- Case-to-podcast matching
- Apple Podcasts and Spotify links
- Safe boundary filtering
- No exposed admin tools
- No placeholder production assets
- No legacy TrueCrimePodList copy

## Product Direction

Cased is not a generic podcast search app.

Cased is not a giant true crime database.

Cased helps a listener answer one question:

What case should I listen to, and what is the best way to hear it?

The intended user experience is guided, curated, and low-decision.

Home should prioritize:

1. Featured Mystery
2. Choose Your Mood
3. Continue Listening, only when real history exists
4. Best For Right Now
5. Explore More

Power-user browsing options such as collections, crime types, media recognition, listening styles, and all cases should live under Explore More instead of competing with the main home flow.

## Core Features

### Mood-First Discovery

Users begin by choosing the type of listening experience they want.

Example moods:

- Chills
- Rabbit Hole
- Closure
- Quick Listen

Each mood maps to relevant cases.

### Case Pages

Each case page should include:

- Spoiler-safe case summary
- Mood tags
- Case metadata
- Boundary-sensitive content handling
- Podcast coverage options
- External listen links

### Podcast Coverage

For each case, Cased should show real podcast coverage options.

Coverage data should include:

- Podcast name
- Episode title
- Episode description
- Publish date
- Duration, when available
- Apple Podcasts link, when available
- Spotify link, when available
- Source URL
- Match confidence
- Review status

### Live Coverage Ingestion

The backend should pull current podcast coverage automatically instead of relying only on manually seeded data.

The ingestion pipeline should:

- Search podcast episodes by case title and aliases
- Pull episode metadata
- Match episodes to cases using confidence scoring
- Skip duplicates
- Store matched episodes
- Auto-publish high-confidence matches
- Queue borderline matches for review
- Ignore low-confidence matches

Confidence rules:

80+ confidence: auto-publish
50 to 79 confidence: needs review
Below 50 confidence: skip

### Boundary Filtering

Cased should support user preferences for content they would rather avoid.

Boundary filtering should be global, quiet, and consistent across:

- Home
- Search
- Mood pages
- Case pages
- Saved
- Explore More

The user should feel guided, not clinically filtered.

## Launch Case Set

The first launch build should support 10 to 15 real cases with strong aliases and likely podcast coverage.

Suggested launch cases:

- Zodiac Killer
- Maura Murray
- Delphi Murders
- JonBenét Ramsey
- Golden State Killer
- Laci Peterson
- Gabby Petito
- Idaho Four
- Adnan Syed
- Anna Sorokin / Anna Delvey
- Chris Watts
- Elizabeth Holmes
- Casey Anthony
- Amanda Knox
- BTK

## Technical Stack

This project is expected to use:

- Expo
- React Native
- TypeScript
- Expo Router
- tRPC
- Drizzle ORM
- AsyncStorage
- Podcast ingestion through available podcast APIs, RSS, iTunes, or Taddy depending on final implementation

## Required Production Cleanup

Before this app can be considered TestFlight-ready, the following must be true:

- App name is fully rebranded to Cased
- No visible TrueCrimePodList references remain
- App config uses Cased name, slug, scheme, and bundle ID
- Production icon and splash assets are local project files
- No /manus-storage asset paths remain
- Visible tabs are exactly Home, Search, Saved, Profile
- Legacy routes are removed or hidden
- Mobile admin buttons are removed
- Admin and ingestion routes are protected
- Unused permissions and plugins are removed
- Case detail has backend fallback behavior
- No visible case opens to Case Not Found
- TypeScript has 0 errors
- Lint has 0 blocking errors
- Live podcast coverage can be ingested and displayed

## Target Navigation

Visible tabs:

Home
Search
Saved
Profile

Hidden or removed from production tab navigation:

Lists
Updates
Admin
Podcast Search
OAuth Callback
Theme Lab

## Backend Launch Requirements

The backend should support:

coverage.recent
coverage.byCaseId
coverage.needsReview

### coverage.recent

Returns newest matched podcast episodes across launch cases.

Used for the New Coverage feed.

### coverage.byCaseId

Returns approved or high-confidence podcast coverage for one case.

Used on case detail pages.

### coverage.needsReview

Returns borderline podcast matches that require human review.

This route should be admin-protected.

## Ingestion Command

The project should include a script such as:

pnpm ingest:launch-cases

The ingestion command should report:

- Cases processed
- Episodes fetched
- Episodes matched
- Episodes auto-approved
- Episodes needing review
- Episodes skipped
- Duplicates skipped
- Errors

## Development Setup

Install dependencies:

pnpm install

Start the app:

pnpm start

Run TypeScript checks:

pnpm check

Run tests, if configured:

pnpm test

Run lint, if configured:

pnpm lint

## Repository Rules

Do not push directly to main.

Use feature branches and pull requests.

Preferred workflow:

Create branch
Commit focused changes
Open pull request
Review diff
Run checks
Squash and merge

Suggested first branch:

cased-launch-recovery

## Immediate Launch Priorities

### PR 1: Baseline Cleanup

- Rebrand fully to Cased
- Remove legacy visible routes
- Clean tab navigation
- Remove admin UI from mobile
- Remove unused permissions
- Fix app assets
- Confirm TypeScript clean

### PR 2: Live Podcast Coverage Backend

- Add or confirm case aliases
- Seed launch cases
- Add coverage routes
- Add ingestion command
- Run ingestion
- Store matched episodes
- Protect admin and ingestion routes

### PR 3: Mood-First Frontend

- Add mood data
- Add mood landing pages
- Rebuild Home around mood-first flow
- Wire case detail to live coverage
- Add clean empty and fallback states

### PR 4: QA and TestFlight Readiness

- Test navigation
- Test saved cases
- Test boundary filtering
- Test live coverage
- Test external links
- Verify production assets
- Verify no legacy copy remains
- Prepare TestFlight build

## Product Principle

Cased should reduce decision fatigue.

Do not turn the home screen into a warehouse of choices.

The app should feel like a trusted editor guiding the user to the right case and the best podcast coverage for that case.
