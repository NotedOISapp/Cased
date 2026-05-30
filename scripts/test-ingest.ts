import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { runPodcastDiscovery } from "../server/podcast-ingestion";
import { getDb } from "../server/db";
import { cases, caseAliases } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

dotenv.config({ path: resolve(process.cwd(), ".env") });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL set. Cannot run ingestion test.");
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
  console.log("Cased — Test Ingestion (Zodiac, Maura Murray, Idaho Four)");
  console.log("=".repeat(60));

  const testCaseIds = ["zodiac-killer", "maura-murray", "idaho-four"];

  const testCases = await db.select().from(cases).where(inArray(cases.id, testCaseIds));
  if (testCases.length === 0) {
      console.log("Test cases not found in DB. Please run 'npx tsx scripts/seed-cases.ts' first.");
      return;
  }

  const allAliases = await db.select().from(caseAliases).where(inArray(caseAliases.caseId, testCaseIds));
  const aliasMap = new Map<string, string[]>();
  for (const a of allAliases) {
      const arr = aliasMap.get(a.caseId) || [];
      arr.push(a.alias);
      aliasMap.set(a.caseId, arr);
  }

  let totalProcessed = 0;
  let totalMatched = 0;
  let totalAutoApproved = 0;
  let totalNeedsReview = 0;
  let totalErrors = 0;

  for (const c of testCases) {
      console.log(`\nProcessing case: ${c.title} (${c.id})`);
      const aliases = aliasMap.get(c.id) || [];
      const res = await runPodcastDiscovery(c.id, c.title, aliases);
      
      console.log(`  Source used: ${res.source}`);
      console.log(`  Shows found/new: ${res.showsFound} / ${res.showsNew}`);
      console.log(`  Episodes stored: ${res.episodesStored}`);
      
      totalProcessed++;
      totalMatched += res.episodesStored;

      // Note: The script logic directly saves it, we can query the DB to see how many were auto-approved vs needs review
      // (This is just a mock reporting output based on the response)

      if (res.errors.length > 0) {
          console.log(`  Errors:`);
          for (const err of res.errors) {
              console.log(`    - ${err}`);
              totalErrors++;
          }
      }
  }

  console.log("\n✅ Test ingestion complete!");
  console.log(`Total Cases Processed: ${totalProcessed}`);
  console.log(`Total Episodes Stored (Matched): ${totalMatched}`);
  console.log(`Total Errors: ${totalErrors}`);
  process.exit(0);
}

main().catch(err => {
    console.error("Ingestion failed:", err);
    process.exit(1);
});
