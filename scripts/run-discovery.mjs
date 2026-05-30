/**
 * run-discovery.mjs
 *
 * Runs podcast discovery for all 15 seeded cases via the tRPC server.
 * Calls admin.listCases to get all case IDs and titles, then calls
 * admin.runDiscovery for each one sequentially with a 2-second delay
 * between requests to avoid rate-limiting the Listen Notes API.
 *
 * Usage: node scripts/run-discovery.mjs
 */

const TRPC_BASE = "http://127.0.0.1:3000/api/trpc";

async function trpcQuery(procedure) {
  const res = await fetch(`${TRPC_BASE}/${procedure}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${procedure}`);
  const body = await res.json();
  return body?.result?.data?.json ?? body?.result?.data;
}

async function trpcMutation(procedure, input) {
  const res = await fetch(`${TRPC_BASE}/${procedure}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = await res.json();
  return body?.result?.data?.json ?? body?.result?.data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=".repeat(60));
  console.log("Cased — Podcast Discovery Runner");
  console.log("=".repeat(60));

  // 1. Fetch all cases
  console.log("\n[1/2] Fetching cases from database...");
  const cases = await trpcQuery("admin.listCases");
  if (!Array.isArray(cases) || cases.length === 0) {
    console.error("No cases found in database. Run seed-cases.mjs first.");
    process.exit(1);
  }
  console.log(`Found ${cases.length} cases.\n`);

  // 2. Run discovery for each case
  const results = [];
  let totalShows = 0;
  let totalEpisodes = 0;
  let failures = 0;

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const num = `[${i + 1}/${cases.length}]`;
    process.stdout.write(`${num} ${c.title.padEnd(35)} → `);

    try {
      const result = await trpcMutation("admin.runDiscovery", {
        caseId: c.id,
        caseTitle: c.title,
      });

      const shows = result?.showsFound ?? 0;
      const episodes = result?.episodesStored ?? 0;
      const source = result?.source ?? "unknown";
      const errors = result?.errors ?? [];

      totalShows += shows;
      totalEpisodes += episodes;

      const status = errors.length > 0 ? "⚠️ " : "✅ ";
      console.log(`${status}${shows} shows, ${episodes} episodes [${source}]`);

      if (errors.length > 0) {
        errors.slice(0, 2).forEach((e) => console.log(`     ⚠ ${e}`));
      }

      results.push({ id: c.id, title: c.title, shows, episodes, source, errors });
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      results.push({ id: c.id, title: c.title, shows: 0, episodes: 0, source: "error", errors: [err.message] });
      failures++;
    }

    // Delay between requests to respect Listen Notes rate limits
    if (i < cases.length - 1) {
      await sleep(2500);
    }
  }

  // 3. Summary
  console.log("\n" + "=".repeat(60));
  console.log("DISCOVERY SUMMARY");
  console.log("=".repeat(60));
  console.log(`Cases processed : ${cases.length}`);
  console.log(`Failures        : ${failures}`);
  console.log(`Total shows     : ${totalShows}`);
  console.log(`Total episodes  : ${totalEpisodes}`);
  console.log("=".repeat(60));

  // 4. Per-case table
  console.log("\nPer-case breakdown:");
  console.log("-".repeat(60));
  for (const r of results) {
    const icon = r.errors.length > 0 ? "⚠️ " : "✅";
    console.log(`${icon} ${r.title.padEnd(35)} ${String(r.shows).padStart(2)} shows  ${String(r.episodes).padStart(3)} eps  [${r.source}]`);
  }
  console.log("-".repeat(60));
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
