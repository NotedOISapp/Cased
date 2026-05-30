/**
 * Podcast API Service Layer
 *
 * Integrates with:
 *  - iTunes Search API (free, no auth) — primary source
 *  - Podcast Index API (requires API key) — secondary source for latest episodes
 *  - Listen Notes API (requires API key) — for Listen Score rankings
 *
 * All network calls are wrapped with a 10-second timeout and graceful error handling
 * so the app never crashes if an API is unavailable.
 */

// ============================================================
// Types
// ============================================================

export interface LivePodcast {
  /** iTunes collection ID — used to build deep links */
  collectionId: number;
  /** Display name of the podcast */
  name: string;
  /** Host / artist name */
  artistName: string;
  /** Total episode count */
  episodeCount: number;
  /** 600x600 artwork image URL */
  artworkUrl: string;
  /** Direct Apple Podcasts URL */
  applePodcastsUrl: string;
  /** RSS feed URL (used to derive Spotify search link) */
  feedUrl: string;
  /** Derived Spotify search URL */
  spotifySearchUrl: string;
  /** Primary genre */
  genre: string;
  /** Most recent release date */
  releaseDate: string;
}

export interface PodcastSearchResult {
  podcasts: LivePodcast[];
  source: 'itunes' | 'cache' | 'error';
  error?: string;
}

// ============================================================
// Helpers
// ============================================================

/** Build a Spotify search URL from a podcast name */
function buildSpotifyUrl(podcastName: string): string {
  const q = encodeURIComponent(podcastName);
  return `https://open.spotify.com/search/${q}/podcasts`;
}

/** Fetch with a timeout so the app never hangs */
async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Map a raw iTunes result to our LivePodcast shape */
function mapItunesResult(r: Record<string, unknown>): LivePodcast {
  const name = (r.collectionName as string) ?? (r.trackName as string) ?? 'Unknown Podcast';
  return {
    collectionId: (r.collectionId as number) ?? (r.trackId as number) ?? 0,
    name,
    artistName: (r.artistName as string) ?? '',
    episodeCount: (r.trackCount as number) ?? 0,
    artworkUrl:
      (r.artworkUrl600 as string) ??
      (r.artworkUrl100 as string) ??
      (r.artworkUrl60 as string) ??
      '',
    applePodcastsUrl:
      ((r.collectionViewUrl as string) ?? (r.trackViewUrl as string) ?? '').replace('?uo=4', ''),
    feedUrl: (r.feedUrl as string) ?? '',
    spotifySearchUrl: buildSpotifyUrl(name),
    genre: (r.primaryGenreName as string) ?? '',
    releaseDate: (r.releaseDate as string) ?? '',
  };
}

// ============================================================
// In-memory cache (avoids re-fetching the same query in one session)
// ============================================================

const searchCache = new Map<string, { results: LivePodcast[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): LivePodcast[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry.results;
}

function setCache(key: string, results: LivePodcast[]): void {
  searchCache.set(key, { results, ts: Date.now() });
}

// ============================================================
// iTunes Search API
// ============================================================

/**
 * Search for podcasts by name using the iTunes Search API.
 * Free, no authentication required.
 *
 * @param query  Search term (e.g. "Serial", "Crime Junkie", "My Favorite Murder")
 * @param limit  Max results to return (default 10, max 200)
 */
export async function searchPodcastsItunes(
  query: string,
  limit = 10
): Promise<PodcastSearchResult> {
  const cacheKey = `itunes:${query.toLowerCase()}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return { podcasts: cached, source: 'cache' };

  try {
    const encoded = encodeURIComponent(query);
    const url = `https://itunes.apple.com/search?term=${encoded}&media=podcast&entity=podcast&limit=${limit}`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      return { podcasts: [], source: 'error', error: `iTunes API returned ${res.status}` };
    }

    const data = (await res.json()) as { resultCount: number; results: Record<string, unknown>[] };
    const podcasts = (data.results ?? []).map(mapItunesResult);
    setCache(cacheKey, podcasts);
    return { podcasts, source: 'itunes' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { podcasts: [], source: 'error', error: message };
  }
}

/**
 * Look up a specific podcast by its iTunes collection ID.
 * Returns null if not found.
 */
export async function lookupPodcastById(collectionId: number): Promise<LivePodcast | null> {
  const cacheKey = `itunes:id:${collectionId}`;
  const cached = getCached(cacheKey);
  if (cached?.[0]) return cached[0];

  try {
    const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=podcast`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { resultCount: number; results: Record<string, unknown>[] };
    if (!data.results?.length) return null;
    const podcast = mapItunesResult(data.results[0]);
    setCache(cacheKey, [podcast]);
    return podcast;
  } catch {
    return null;
  }
}

/**
 * Search for true crime podcasts related to a specific case name.
 * Tries the case name first; if fewer than 3 results, also tries adding "true crime" to the query.
 */
export async function searchPodcastsForCase(caseName: string): Promise<PodcastSearchResult> {
  const primary = await searchPodcastsItunes(caseName, 8);
  if (primary.source === 'error') return primary;

  // Filter to only podcasts that are likely true crime
  const trueCrimeKeywords = [
    'crime', 'murder', 'killer', 'cold case', 'investigation', 'detective',
    'forensic', 'homicide', 'missing', 'serial', 'unsolved', 'true crime',
    'justice', 'trial', 'court', 'victim', 'suspect', 'case',
  ];

  const filtered = primary.podcasts.filter((p) => {
    const text = `${p.name} ${p.artistName} ${p.genre}`.toLowerCase();
    return (
      p.genre.toLowerCase().includes('true crime') ||
      trueCrimeKeywords.some((kw) => text.includes(kw))
    );
  });

  // If we have enough results, return them
  if (filtered.length >= 3) {
    return { podcasts: filtered, source: primary.source };
  }

  // Otherwise, broaden the search with "true crime" appended
  const broader = await searchPodcastsItunes(`${caseName} true crime`, 10);
  if (broader.source === 'error') {
    return { podcasts: filtered, source: primary.source };
  }

  // Merge, deduplicate by collectionId
  const seen = new Set(filtered.map((p) => p.collectionId));
  const merged = [...filtered];
  for (const p of broader.podcasts) {
    if (!seen.has(p.collectionId)) {
      seen.add(p.collectionId);
      merged.push(p);
    }
  }

  return { podcasts: merged.slice(0, 8), source: 'itunes' };
}

// ============================================================
// Podcast Index API (requires API key)
// ============================================================

/**
 * Search Podcast Index for the latest episodes related to a case.
 * Requires PODCAST_INDEX_KEY and PODCAST_INDEX_SECRET environment variables.
 *
 * This is a placeholder that will activate once keys are provided.
 */
export async function searchPodcastIndex(
  query: string,
  _apiKey?: string,
  _apiSecret?: string
): Promise<PodcastSearchResult> {
  // Podcast Index uses HMAC-SHA1 auth — requires a server-side proxy to avoid
  // exposing secrets in the mobile bundle. This will be wired to the backend
  // once API keys are provided.
  void query;
  return { podcasts: [], source: 'error', error: 'Podcast Index API key not yet configured' };
}

// ============================================================
// Listen Notes API (requires API key)
// ============================================================

/**
 * Search Listen Notes for podcasts with Listen Score data.
 * Requires LISTEN_NOTES_API_KEY environment variable.
 *
 * This is a placeholder that will activate once a key is provided.
 */
export async function searchListenNotes(
  query: string,
  _apiKey?: string
): Promise<PodcastSearchResult> {
  void query;
  return { podcasts: [], source: 'error', error: 'Listen Notes API key not yet configured' };
}
