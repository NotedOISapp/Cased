/**
 * Fetch full episode metadata for 5 selected cases via Listen Notes API.
 * Searches for episodes, deduplicates by show, fetches podcast metadata.
 */

import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.LISTEN_NOTES_API_KEY;
if (!API_KEY) throw new Error('LISTEN_NOTES_API_KEY not set');

const BASE = 'https://listen-api.listennotes.com/api/v2';

async function searchEpisodes(query, pageSize = 10) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&type=episode&page_size=${pageSize}&language=English&sort_by_date=0`;
  const res = await fetch(url, { headers: { 'X-ListenAPI-Key': API_KEY } });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.results || [];
}

async function getPodcast(id) {
  await sleep(1200);
  const url = `${BASE}/podcasts/${id}`;
  const res = await fetch(url, { headers: { 'X-ListenAPI-Key': API_KEY } });
  if (!res.ok) return null;
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function formatDuration(sec) {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  return `${m} min`;
}

function formatDate(ms) {
  if (!ms) return null;
  return new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const CASES = [
  {
    slug: 'idaho4',
    caseName: 'The Idaho 4 Murders',
    queries: ['Idaho 4 murders Kaylee Goncalves Madison Mogen', 'Moscow Idaho murders 2022'],
  },
  {
    slug: 'jonbenet',
    caseName: 'JonBenét Ramsey',
    queries: ['JonBenet Ramsey murder Boulder Colorado', 'JonBenet Ramsey case 1996'],
  },
  {
    slug: 'laci_peterson',
    caseName: 'Laci Peterson',
    queries: ['Laci Peterson murder Scott Peterson', 'Laci Peterson case 2002'],
  },
  {
    slug: 'gabby_petito',
    caseName: 'Gabby Petito',
    queries: ['Gabby Petito murder Brian Laundrie', 'Gabby Petito case 2021'],
  },
  {
    slug: 'delphi',
    caseName: 'The Delphi Murders',
    queries: ['Delphi Indiana murders Abby Williams Libby Koch', 'Richard Allen Delphi murders trial'],
  },
];

const output = {};

for (const c of CASES) {
  console.log(`\n📡 Fetching: ${c.caseName}`);
  const episodeMap = {};

  for (const q of c.queries) {
    try {
      const episodes = await searchEpisodes(q, 10);
      await sleep(1200);
      for (const ep of episodes) {
        const pid = ep.podcast?.id;
        if (!pid || episodeMap[ep.id]) continue;
        episodeMap[ep.id] = {
          episodeId: ep.id,
          episodeTitle: ep.title_original || ep.title,
          podcastId: pid,
          podcastName: ep.podcast?.title_original || ep.podcast?.title,
          durationSec: ep.audio_length_sec,
          durationFormatted: formatDuration(ep.audio_length_sec),
          pubDateMs: ep.pub_date_ms,
          pubDateFormatted: formatDate(ep.pub_date_ms),
          description: (ep.description_original || ep.description || '').slice(0, 500),
          listenNotesUrl: ep.listennotes_url,
          image: ep.image,
          podcastImage: ep.podcast?.image,
        };
      }
    } catch (e) {
      console.error(`  Query error: ${e.message}`);
    }
  }

  // Group by podcast, pick best episode per show
  const byPodcast = {};
  for (const ep of Object.values(episodeMap)) {
    if (!byPodcast[ep.podcastId]) byPodcast[ep.podcastId] = [];
    byPodcast[ep.podcastId].push(ep);
  }

  const podcasts = [];
  for (const [pid, eps] of Object.entries(byPodcast)) {
    // Sort by duration desc (longer = more coverage)
    eps.sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0));
    const best = eps[0];
    podcasts.push({
      podcastId: pid,
      podcastName: best.podcastName,
      podcastImage: best.podcastImage,
      episodeId: best.episodeId,
      episodeTitle: best.episodeTitle,
      durationSec: best.durationSec,
      durationFormatted: best.durationFormatted,
      pubDateMs: best.pubDateMs,
      pubDateFormatted: best.pubDateFormatted,
      description: best.description,
      listenNotesUrl: best.listenNotesUrl,
      episodeImage: best.image,
      allEpisodeCount: eps.length,
    });
  }

  // Sort by duration desc
  podcasts.sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0));

  output[c.slug] = {
    caseName: c.caseName,
    totalEpisodes: Object.keys(episodeMap).length,
    totalShows: podcasts.length,
    podcasts,
  };

  console.log(`  ✅ ${podcasts.length} shows, ${Object.keys(episodeMap).length} total episodes`);
  for (const p of podcasts) {
    console.log(`     • ${p.podcastName}: "${p.episodeTitle}" (${p.durationFormatted || '?'})`);
  }
}

writeFileSync(
  '/home/ubuntu/truecrimepodlist/scripts/five-cases-data.json',
  JSON.stringify(output, null, 2)
);
console.log('\n✅ Saved to scripts/five-cases-data.json');
