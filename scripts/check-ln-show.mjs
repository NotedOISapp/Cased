import "dotenv/config";
const key = process.env.LISTEN_NOTES_API_KEY;
if (!key) { console.log("No LN key"); process.exit(0); }

async function searchPodcasts(q) {
  const res = await fetch(`https://listen-api.listennotes.com/api/v2/search?q=${encodeURIComponent(q)}&type=podcast&page_size=3`, {
    headers: { "X-ListenAPI-Key": key }
  });
  const d = await res.json();
  console.log(`\n=== "${q}" (${d.total} total) ===`);
  for (const show of (d.results ?? []).slice(0, 2)) {
    console.log("  title_original:", show.title_original);
    console.log("  publisher_original:", show.publisher_original);
    console.log("  itunes_id:", show.itunes_id);
    console.log("  rss:", show.rss?.slice(0, 60));
    console.log("  total_episodes:", show.total_episodes);
  }
}

async function searchEpisodes(q) {
  const res = await fetch(`https://listen-api.listennotes.com/api/v2/search?q=${encodeURIComponent(q)}&type=episode&page_size=3`, {
    headers: { "X-ListenAPI-Key": key }
  });
  const d = await res.json();
  console.log(`\n=== EPISODES "${q}" (${d.total} total) ===`);
  for (const ep of (d.results ?? []).slice(0, 2)) {
    console.log("  ep title_original:", ep.title_original);
    console.log("  podcast.title_original:", ep.podcast?.title_original);
    console.log("  podcast.publisher_original:", ep.podcast?.publisher_original);
    console.log("  audio_length_sec:", ep.audio_length_sec);
  }
}

await searchPodcasts("Scott Peterson murder");
await searchEpisodes("Scott Peterson Laci murder");
await searchPodcasts("Delphi murders Indiana");
await searchEpisodes("Delphi murders Libby Abby");
