import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { runPodcastDiscovery } from "../server/podcast-ingestion";
import { getDb } from "../server/db";
import { cases, caseAliases } from "../drizzle/schema";
import { eq } from "drizzle-orm";

dotenv.config({ path: resolve(process.cwd(), ".env") });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL set. Cannot run ingestion script.");
    return;
  }
  
  if (!process.env.TADDY_USER_ID || !process.env.TADDY_API_KEY) {
     console.log("Missing Taddy credentials. TADDY_USER_ID and TADDY_API_KEY environment variables are required.");
     return;
  }

  const db = await getDb();
  if (!db) {
     console.error("Failed to connect to the database");
     return;
  }

  console.log("=".repeat(60));
  console.log("Cased — Launch Cases Ingestion (Taddy)");
  console.log("=".repeat(60));

  const allCases = await db.select().from(cases);
  if (allCases.length === 0) {
      console.log("No cases found in DB. Please run 'npx tsx scripts/seed-cases.ts' first.");
      return;
  }

  const allAliases = await db.select().from(caseAliases);
  const aliasMap = new Map<string, string[]>();
  for (const a of allAliases) {
      const arr = aliasMap.get(a.caseId) || [];
      arr.push(a.alias);
      aliasMap.set(a.caseId, arr);
  }

  // We are ingesting all cases we find in the DB
  for (const c of allCases) {
      console.log(`\nProcessing case: ${c.title} (${c.id})`);
      const aliases = aliasMap.get(c.id) || [];
      const res = await runPodcastDiscovery(c.id, c.title, aliases);
      
      console.log(`  Source used: ${res.source}`);
      console.log(`  Shows found/new: ${res.showsFound} / ${res.showsNew}`);
      console.log(`  Episodes stored: ${res.episodesStored}`);
      if (res.errors.length > 0) {
          console.log(`  Errors:`);
          for (const err of res.errors) {
              console.log(`    - ${err}`);
          }
      }
  }

  console.log("\n✅ Launch cases ingestion complete!");
  process.exit(0);
}

main().catch(err => {
    console.error("Ingestion failed:", err);
    process.exit(1);
});
