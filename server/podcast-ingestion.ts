/**
 * Podcast Ingestion Pipeline
 *
 * Two-source discovery strategy:
 *  1. Listen Notes API (primary) — rich metadata, real episode durations, episode-level search
 *  2. iTunes Search API (fallback) — free, no key required, show-level only
 *  3. RSS Feed Parser — episode-level metadata from show feeds
 *  4. DB persistence — upsert shows, episodes, and case-show links
 *
 * All functions are safe to call repeatedly (idempotent via upsert).
 */

import * as db from "./db";

// ============================================================
// Types
// ============================================================

interface ItunesResult {
  collectionId: number;
  trackId?: number;
  collectionName?: string;
  trackName?: string;
  artistName: string;
  artworkUrl600?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  collectionViewUrl?: string;
  trackViewUrl?: string;
  feedUrl?: string;
  trackCount?: number;
  primaryGenreName?: string;
  releaseDate?: string;
}

interface RssEpisode {
  guid: string;
  title: string;
  description: string;
  pubDate: string | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  episodeUrl: string | null;
}

interface ListenNotesEpisode {
  id: string;
  title_original?: string;
  title?: string;
  description_original?: string;
  description?: string;
  pub_date_ms: number;
  audio_length_sec: number;
  audio: string;
  link: string;
  thumbnail: string;
  podcast: {
    id: string;
    title_original?: string;
    title?: string;
    publisher_original?: string;
    publisher?: string;
    image?: string;
    thumbnail: string;
    listen_score: number;
    listen_score_global_rank: string;
    itunes_id?: number;
  };
}

interface ListenNotesPodcast {
  id: string;
  title: string;
  publisher: string;
  thumbnail: string;
  description: string;
  total_episodes: number;
  listen_score: number;
  listen_score_global_rank: string;
  itunes_id?: number;
  rss?: string;
  website?: string;
}

// ============================================================
// Helpers
// ============================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildSpotifyUrl(podcastName: string): string {
  if (!podcastName) return "";
  return `https://open.spotify.com/search/${encodeURIComponent(podcastName)}/podcasts`;
}

/** Strip Listen Notes plan-gate messages from RSS feed URLs */
function sanitiseRssUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.includes("listennotes.com/api/pricing") || url.includes("Please upgrade")) return "";
  return url;
}

/** Parse ISO 8601 duration (PT1H23M45S) or HH:MM:SS into seconds */
function parseDuration(raw: string | null | undefined): number | null {
  if (!raw) return null;
  // ISO 8601
  const iso = raw.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (iso) {
    return (parseInt(iso[1] ?? "0") * 3600) +
           (parseInt(iso[2] ?? "0") * 60) +
           parseInt(iso[3] ?? "0");
  }
  // HH:MM:SS or MM:SS
  const parts = raw.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  const n = parseInt(raw);
  return isNaN(n) ? null : n; // raw seconds
}

/** Strip HTML tags from show notes */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
}

// ============================================================
// Listen Notes API
// ============================================================

const LISTEN_NOTES_BASE = "https://listen-api.listennotes.com/api/v2";

function getListenNotesHeaders(): Record<string, string> {
  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) throw new Error("LISTEN_NOTES_API_KEY not set");
  return { "X-ListenAPI-Key": key };
}

/**
 * Search Listen Notes for episodes covering a case.
 * Returns up to 10 episode results with real durations.
 */
export async function searchListenNotesEpisodes(
  caseTitle: string,
  limit = 10
): Promise<ListenNotesEpisode[]> {
  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) return [];

  try {
    const query = encodeURIComponent(`${caseTitle} true crime`);
    const url = `${LISTEN_NOTES_BASE}/search?q=${query}&type=episode&language=English&len_min=5&safe_mode=0&page_size=${limit}`;
    const res = await fetchWithTimeout(url, { headers: getListenNotesHeaders() });
    if (!res.ok) {
      console.warn(`[ListenNotes] Episode search failed: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as { results?: ListenNotesEpisode[] };
    return data.results ?? [];
  } catch (err) {
    console.warn("[ListenNotes] Episode search error:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Search Listen Notes for podcast shows covering a case.
 * Returns up to 10 show results.
 */
export async function searchListenNotesShows(
  caseTitle: string,
  limit = 10
): Promise<ListenNotesPodcast[]> {
  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) return [];

  try {
    const query = encodeURIComponent(`${caseTitle} true crime`);
    const url = `${LISTEN_NOTES_BASE}/search?q=${query}&type=podcast&language=English&page_size=${limit}`;
    const res = await fetchWithTimeout(url, { headers: getListenNotesHeaders() });
    if (!res.ok) {
      console.warn(`[ListenNotes] Show search failed: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as { results?: ListenNotesPodcast[] };
    return data.results ?? [];
  } catch (err) {
    console.warn("[ListenNotes] Show search error:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Fetch full podcast details from Listen Notes by podcast ID.
 * Useful for getting the RSS feed URL for a show found via episode search.
 */
export async function getListenNotesPodcastById(
  podcastId: string
): Promise<ListenNotesPodcast | null> {
  const key = process.env.LISTEN_NOTES_API_KEY;
  if (!key) return null;

  try {
    const url = `${LISTEN_NOTES_BASE}/podcasts/${podcastId}`;
    const res = await fetchWithTimeout(url, { headers: getListenNotesHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as ListenNotesPodcast;
  } catch {
    return null;
  }
}

// ============================================================
// iTunes Search (fallback)
// ============================================================

/**
 * Search iTunes for podcast shows covering a given case.
 * Returns up to 10 results filtered to true crime relevance.
 */
export async function searchItunesForCase(
  caseTitle: string,
  limit = 10
): Promise<ItunesResult[]> {
  const trueCrimeKeywords = [
    "crime", "murder", "killer", "cold case", "investigation", "detective",
    "forensic", "homicide", "missing", "serial", "unsolved", "true crime",
    "justice", "trial", "court", "victim", "suspect", "case", "podcast",
  ];

  const queries = [caseTitle, `${caseTitle} true crime`, `${caseTitle} podcast`];
  const seen = new Set<number>();
  const results: ItunesResult[] = [];

  for (const query of queries) {
    if (results.length >= limit) break;
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&entity=podcast&limit=15`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;
      const data = (await res.json()) as { results: ItunesResult[] };
      for (const r of data.results ?? []) {
        const id = r.collectionId ?? r.trackId ?? 0;
        if (!id || seen.has(id)) continue;
        const text = `${r.collectionName ?? ""} ${r.trackName ?? ""} ${r.artistName} ${r.primaryGenreName ?? ""}`.toLowerCase();
        const isRelevant =
          (r.primaryGenreName ?? "").toLowerCase().includes("true crime") ||
          trueCrimeKeywords.some((kw) => text.includes(kw));
        if (!isRelevant) continue;
        seen.add(id);
        results.push(r);
        if (results.length >= limit) break;
      }
    } catch {
      // Continue to next query on network error
    }
  }

  return results;
}

// ============================================================
// RSS Feed Parser
// ============================================================

/**
 * Fetch and parse a podcast RSS feed.
 * Returns up to 100 most recent episodes.
 */
export async function parseRssFeed(feedUrl: string): Promise<RssEpisode[]> {
  if (!feedUrl) return [];

  try {
    const res = await fetchWithTimeout(feedUrl, {}, 15000);
    if (!res.ok) return [];
    const xml = await res.text();

    const episodes: RssEpisode[] = [];
    // Match <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && episodes.length < 100) {
      const item = match[1];

      const guid = extractTag(item, "guid") ?? extractTag(item, "enclosure", "url") ?? `${Date.now()}-${episodes.length}`;
      const title = decodeEntities(extractTag(item, "title") ?? "");
      const description = stripHtml(
        extractTag(item, "description") ??
        extractTag(item, "content:encoded") ??
        extractTag(item, "itunes:summary") ??
        ""
      );
      const pubDate = extractTag(item, "pubDate");
      const durationRaw = extractTag(item, "itunes:duration");
      const audioUrl = extractAttr(item, "enclosure", "url");
      const episodeUrl = extractTag(item, "link") ?? extractTag(item, "guid");

      episodes.push({
        guid,
        title,
        description,
        pubDate: pubDate ? new Date(pubDate).toISOString() : null,
        durationSeconds: parseDuration(durationRaw),
        audioUrl: audioUrl ?? null,
        episodeUrl: episodeUrl ?? null,
      });
    }

    return episodes;
  } catch {
    return [];
  }
}

function extractTag(xml: string, tag: string, attr?: string): string | null {
  if (attr) {
    const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
    return xml.match(re)?.[1] ?? null;
  }
  const re = new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`, "i");
  return xml.match(re)?.[1]?.trim() ?? null;
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  return xml.match(re)?.[1] ?? null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// ============================================================
// Main ingestion function
// ============================================================

export interface IngestionResult {
  caseId: string;
  showsFound: number;
  showsNew: number;
  episodesStored: number;
  errors: string[];
  source: "listen_notes" | "itunes" | "mixed";
}

/**
 * Run the full podcast discovery pipeline for a single case.
 *
 * Strategy:
 *  1. Try Listen Notes first (richer data, real durations)
 *  2. Fall back to iTunes if Listen Notes fails or returns nothing
 *  3. For each show found: upsert to podcast_shows, create case-show link
 *  4. Fetch RSS feed and upsert episodes (with relevance filtering)
 *  5. Also store Listen Notes episodes directly (they already have durations)
 */
export async function runPodcastDiscovery(
  caseId: string,
  caseTitle: string
): Promise<IngestionResult> {
  const result: IngestionResult = {
    caseId,
    showsFound: 0,
    showsNew: 0,
    episodesStored: 0,
    errors: [],
    source: "itunes",
  };

  const logId = await db.logIngestionStart({
    jobType: "podcast_discovery",
    caseId,
    message: `Discovering podcasts for: ${caseTitle}`,
  });

  try {
    // --------------------------------------------------------
    // Step 1: Try Listen Notes (primary source)
    // --------------------------------------------------------
    const hasListenNotes = !!process.env.LISTEN_NOTES_API_KEY;
    let listenNotesEpisodes: ListenNotesEpisode[] = [];
    let listenNotesShows: ListenNotesPodcast[] = [];

    if (hasListenNotes) {
      [listenNotesEpisodes, listenNotesShows] = await Promise.all([
        searchListenNotesEpisodes(caseTitle, 10),
        searchListenNotesShows(caseTitle, 10),
      ]);
      result.source = listenNotesEpisodes.length > 0 || listenNotesShows.length > 0
        ? "listen_notes"
        : "itunes";
    }

    // --------------------------------------------------------
    // Step 2: Process Listen Notes episodes (direct episode data)
    // --------------------------------------------------------
    const lnPodcastIds = new Set<string>();

    for (const ep of listenNotesEpisodes) {
      try {
        const pod = ep.podcast;
        if (!pod?.id) continue;
        lnPodcastIds.add(pod.id);

        // Upsert the show
        const existing = pod.itunes_id ? await db.getShowByItunesId(pod.itunes_id) : null;
        if (!existing) result.showsNew++;

        const podTitle = pod.title_original ?? pod.title ?? "";
        const podPublisher = pod.publisher_original ?? pod.publisher ?? "";
        const podArtwork = pod.image ?? pod.thumbnail ?? "";
        if (!podTitle) continue; // Skip if we can't identify the show

        const showId = await db.upsertPodcastShow({
          itunesId: pod.itunes_id ?? null,
          name: podTitle,
          artistName: podPublisher,
          artworkUrl: podArtwork,
          applePodcastsUrl: pod.itunes_id
            ? `https://podcasts.apple.com/podcast/id${pod.itunes_id}`
            : "",
          spotifySearchUrl: buildSpotifyUrl(podTitle),
          rssFeedUrl: "",
          genre: "True Crime",
          totalEpisodeCount: 0,
        });

        // Create case-show link
        const linkExists = await db.getCaseShowExists(caseId, showId);
        if (!linkExists) {
          await db.upsertCaseShow({
            caseId,
            showId,
            episodeCount: 0,
            coverageDepth: "Overview",
            timeCommitment: "Under1Hr",
            narrativeStyle: "StraightRetelling",
            tone: "Narrative",
            includesRecentUpdates: false,
          });
        }

        // Store the episode directly (Listen Notes gives us real duration)
        const epTitle = ep.title_original ?? ep.title ?? "";
        const epDescription = ep.description_original ?? ep.description ?? "";
        const pubDate = ep.pub_date_ms ? new Date(ep.pub_date_ms) : null;
        await db.upsertPodcastEpisode({
          showId,
          caseId,
          rssGuid: ep.id,
          titleOriginal: epTitle,
          descriptionOriginal: stripHtml(epDescription),
          publishDate: pubDate,
          durationSeconds: ep.audio_length_sec ?? null,
          audioUrl: ep.audio ?? null,
          episodeUrl: ep.link ?? null,
          caseMatchConfidence: 85, // Listen Notes search = high confidence
          needsReview: false,
        });
        result.episodesStored++;
        result.showsFound++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`LN episode error: ${msg}`);
      }
    }

    // --------------------------------------------------------
    // Step 3: Process Listen Notes shows (for RSS feed ingestion)
    // --------------------------------------------------------
    for (const show of listenNotesShows) {
      try {
        if (lnPodcastIds.has(show.id)) continue; // Already processed via episodes
        lnPodcastIds.add(show.id);

        const existing = show.itunes_id ? await db.getShowByItunesId(show.itunes_id) : null;
        if (!existing) result.showsNew++;

        const showId = await db.upsertPodcastShow({
          itunesId: show.itunes_id ?? null,
          name: show.title,
          artistName: show.publisher ?? "",
          artworkUrl: show.thumbnail ?? "",
          applePodcastsUrl: show.itunes_id
            ? `https://podcasts.apple.com/podcast/id${show.itunes_id}`
            : "",
          spotifySearchUrl: buildSpotifyUrl(show.title),
          rssFeedUrl: sanitiseRssUrl(show.rss),
          genre: "True Crime",
          totalEpisodeCount: show.total_episodes ?? 0,
        });

        const linkExists = await db.getCaseShowExists(caseId, showId);
        if (!linkExists) {
          await db.upsertCaseShow({
            caseId,
            showId,
            episodeCount: 0,
            coverageDepth: "Overview",
            timeCommitment: "Under1Hr",
            narrativeStyle: "StraightRetelling",
            tone: "Narrative",
            includesRecentUpdates: false,
          });
        }

        // Parse RSS for episodes if we have a feed URL
        if (show.rss) {
          const episodes = await parseRssFeed(show.rss);
          let count = 0;
          for (const ep of episodes) {
            const text = `${ep.title} ${ep.description}`.toLowerCase();
            const caseWords = caseTitle.toLowerCase().split(" ").filter((w) => w.length > 3);
            if (!caseWords.some((word) => text.includes(word))) continue;

            await db.upsertPodcastEpisode({
              showId,
              caseId,
              rssGuid: ep.guid,
              titleOriginal: ep.title,
              descriptionOriginal: ep.description,
              publishDate: ep.pubDate ? new Date(ep.pubDate) : null,
              durationSeconds: ep.durationSeconds,
              audioUrl: ep.audioUrl,
              episodeUrl: ep.episodeUrl,
              caseMatchConfidence: 70,
              needsReview: false,
            });
            count++;
            result.episodesStored++;
          }
          if (count > 0) {
            await db.upsertCaseShow({
              caseId,
              showId,
              episodeCount: count,
              coverageDepth: count >= 5 ? "Exhaustive" : count >= 2 ? "InDepth" : "Overview",
              timeCommitment: "Under1Hr",
              narrativeStyle: "StraightRetelling",
              tone: "Narrative",
              includesRecentUpdates: false,
            });
          }
        }
        result.showsFound++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`LN show error: ${msg}`);
      }
    }

    // --------------------------------------------------------
    // Step 4: iTunes fallback (if Listen Notes returned nothing)
    // --------------------------------------------------------
    if (result.showsFound === 0) {
      result.source = "itunes";
      const itunesShows = await searchItunesForCase(caseTitle);
      result.showsFound += itunesShows.length;

      for (const show of itunesShows) {
        try {
          const itunesId = show.collectionId ?? show.trackId ?? 0;
          if (!itunesId) continue;

          const name = show.collectionName ?? show.trackName ?? "Unknown";
          const feedUrl = show.feedUrl ?? "";
          const artworkUrl = show.artworkUrl600 ?? show.artworkUrl100 ?? show.artworkUrl60 ?? "";
          const applePodcastsUrl = (show.collectionViewUrl ?? show.trackViewUrl ?? "").replace("?uo=4", "");

          const existing = await db.getShowByItunesId(itunesId);
          if (!existing) result.showsNew++;

          const showId = await db.upsertPodcastShow({
            itunesId,
            name,
            artistName: show.artistName ?? "",
            artworkUrl,
            applePodcastsUrl,
            spotifySearchUrl: buildSpotifyUrl(name),
            rssFeedUrl: feedUrl,
            genre: show.primaryGenreName ?? "True Crime",
            totalEpisodeCount: show.trackCount ?? 0,
          });

          const linkExists = await db.getCaseShowExists(caseId, showId);
          if (!linkExists) {
            await db.upsertCaseShow({
              caseId,
              showId,
              episodeCount: 0,
              coverageDepth: "Overview",
              timeCommitment: "Under1Hr",
              narrativeStyle: "StraightRetelling",
              tone: "Narrative",
              includesRecentUpdates: false,
            });
          }

          if (feedUrl) {
            const episodes = await parseRssFeed(feedUrl);
            let count = 0;
            for (const ep of episodes) {
              const text = `${ep.title} ${ep.description}`.toLowerCase();
              const caseWords = caseTitle.toLowerCase().split(" ").filter((w) => w.length > 3);
              if (!caseWords.some((word) => text.includes(word))) continue;

              await db.upsertPodcastEpisode({
                showId,
                caseId,
                rssGuid: ep.guid,
                titleOriginal: ep.title,
                descriptionOriginal: ep.description,
                publishDate: ep.pubDate ? new Date(ep.pubDate) : null,
                durationSeconds: ep.durationSeconds,
                audioUrl: ep.audioUrl,
                episodeUrl: ep.episodeUrl,
                caseMatchConfidence: 70,
                needsReview: false,
              });
              count++;
              result.episodesStored++;
            }
            if (count > 0) {
              await db.upsertCaseShow({
                caseId,
                showId,
                episodeCount: count,
                coverageDepth: count >= 5 ? "Exhaustive" : count >= 2 ? "InDepth" : "Overview",
                timeCommitment: "Under1Hr",
                narrativeStyle: "StraightRetelling",
                tone: "Narrative",
                includesRecentUpdates: false,
              });
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`iTunes show error: ${msg}`);
        }
      }
    } else if (result.showsFound > 0 && result.source === "listen_notes") {
      result.source = "listen_notes";
    }

    // Mark case as synced
    await db.markCasePodcastSynced(caseId);

    await db.logIngestionComplete(
      logId,
      "success",
      `[${result.source}] Found ${result.showsFound} shows, stored ${result.episodesStored} episodes`,
      result.episodesStored
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    await db.logIngestionComplete(logId, "error", msg, 0);
  }

  return result;
}

// ============================================================
// Bulk discovery (all cases)
// ============================================================

/**
 * Run discovery for all cases that haven't been synced in the last 23 hours.
 * Called by the cron scheduler.
 */
export async function discoverAll(): Promise<{ processed: number; errors: number }> {
  const cases = await db.getAllCases();
  const now = Date.now();
  const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

  let processed = 0;
  let errors = 0;

  for (const c of cases) {
    // Skip if synced recently
    if (c.lastPodcastSyncAt) {
      const lastSync = new Date(c.lastPodcastSyncAt).getTime();
      if (now - lastSync < TWENTY_THREE_HOURS) continue;
    }

    try {
      await runPodcastDiscovery(c.id, c.title);
      processed++;
      // Small delay between cases to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1500));
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}
