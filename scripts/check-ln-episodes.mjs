import "dotenv/config";
const key = process.env.LISTEN_NOTES_API_KEY;
if (!key) { console.log("No LN key"); process.exit(0); }

async function searchEpisodes(caseTitle) {
  const query = encodeURIComponent(`${caseTitle} true crime`);
  const url = `https://listen-api.listennotes.com/api/v2/search?q=${query}&type=episode&language=English&len_min=5&safe_mode=0&page_size=10`;
  const res = await fetch(url, { headers: { "X-ListenAPI-Key": key } });
  const d = await res.json();
  console.log(`\n=== "${caseTitle} true crime" → ${d.total ?? 0} total, ${d.results?.length ?? 0} returned ===`);
  if (d.error) console.log("  ERROR:", d.error);
  for (const ep of (d.results ?? []).slice(0, 3)) {
    const pod = ep.podcast ?? {};
    console.log(`  [${ep.audio_length_sec}s] ${ep.title_original ?? ep.title}`);
    console.log(`    podcast: ${pod.title_original ?? pod.title ?? "(no title)"}`);
  }
}

await searchEpisodes("Scott Peterson");
await searchEpisodes("The Delphi Murders");
await searchEpisodes("Delphi Murders");
