/**
 * Probe Listen Notes API for 5 candidate cases to find which have the richest podcast coverage.
 * Outputs: show names, episode counts, listen scores, and episode metadata.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.LISTEN_NOTES_API_KEY;
if (!API_KEY) throw new Error('LISTEN_NOTES_API_KEY not set');

const BASE = 'https://listen-api.listennotes.com/api/v2';

async function search(query) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&type=episode&page_size=10&language=English`;
  const res = await fetch(url, { headers: { 'X-ListenAPI-Key': API_KEY } });
  if (!res.ok) throw new Error(`Search failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getPodcast(id) {
  const url = `${BASE}/podcasts/${id}?sort=recent_first`;
  const res = await fetch(url, { headers: { 'X-ListenAPI-Key': API_KEY } });
  if (!res.ok) return null;
  return res.json();
}

const CASES = [
  { name: 'Idaho 4 murders', slug: 'idaho4' },
  { name: 'Gabby Petito murder', slug: 'gabby_petito' },
  { name: 'JonBenet Ramsey murder', slug: 'jonbenet' },
  { name: 'Laci Peterson murder', slug: 'laci_peterson' },
  { name: 'Delphi murders Libby Koch Abby Williams', slug: 'delphi' },
];

const results = {};

for (const c of CASES) {
  console.log(`\n🔍 Searching: ${c.name}`);
  try {
    const data = await search(c.name);
    const episodes = data.results || [];
    
    // Deduplicate by podcast id
    const podcastMap = {};
    for (const ep of episodes) {
      const pid = ep.podcast?.id;
      if (!pid) continue;
      if (!podcastMap[pid]) {
        podcastMap[pid] = {
          podcastId: pid,
          podcastTitle: ep.podcast?.title_original || ep.podcast?.title,
          listenScore: ep.podcast?.listen_score,
          listenScoreGlobal: ep.podcast?.listen_score_global_rank,
          episodes: [],
        };
      }
      podcastMap[pid].episodes.push({
        episodeId: ep.id,
        title: ep.title_original || ep.title,
        durationSec: ep.audio_length_sec,
        pubDate: ep.pub_date_ms ? new Date(ep.pub_date_ms).toISOString().split('T')[0] : null,
        description: (ep.description_original || ep.description || '').slice(0, 300),
        appleUrl: ep.listennotes_url,
        spotifyUrl: null,
      });
    }

    results[c.slug] = {
      caseName: c.name,
      podcastCount: Object.keys(podcastMap).length,
      podcasts: Object.values(podcastMap),
    };

    console.log(`   Found ${episodes.length} episodes across ${Object.keys(podcastMap).length} shows`);
    for (const p of Object.values(podcastMap)) {
      const dur = p.episodes[0]?.durationSec ? `${Math.round(p.episodes[0].durationSec / 60)} min` : '?';
      console.log(`   • ${p.podcastTitle} (score: ${p.listenScore ?? 'n/a'}) — ${p.episodes.length} ep(s), first: ${dur}`);
    }
  } catch (e) {
    console.error(`   ERROR: ${e.message}`);
    results[c.slug] = { caseName: c.name, error: e.message };
  }

  // Rate limit: 1 req/sec on free tier
  await new Promise(r => setTimeout(r, 1200));
}

import { writeFileSync } from 'fs';
writeFileSync('/home/ubuntu/cased/scripts/probe-results.json', JSON.stringify(results, null, 2));
console.log('\n✅ Results saved to scripts/probe-results.json');
