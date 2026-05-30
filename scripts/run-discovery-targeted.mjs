/**
 * run-discovery-targeted.mjs
 * Re-runs podcast discovery for specific cases only.
 */

const TRPC_BASE = "http://127.0.0.1:3000/api/trpc";

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

// Cases that got 0 episodes in the first run
const TARGET_CASES = [
  { id: "case_scott_peterson", title: "Scott Peterson" },
  { id: "case_delphi_murders", title: "The Delphi Murders" },
];

console.log("=".repeat(60));
console.log("Targeted Re-Discovery Run");
console.log("=".repeat(60));

for (let i = 0; i < TARGET_CASES.length; i++) {
  const c = TARGET_CASES[i];
  const num = `[${i + 1}/${TARGET_CASES.length}]`;
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

    const status = errors.length > 0 ? "⚠️ " : "✅ ";
    console.log(`${status}${shows} shows, ${episodes} episodes [${source}]`);
    if (errors.length > 0) {
      errors.slice(0, 2).forEach((e) => console.log(`     ⚠ ${e.slice(0, 120)}`));
    }
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }

  if (i < TARGET_CASES.length - 1) {
    await sleep(3000);
  }
}

console.log("\nDone.");
