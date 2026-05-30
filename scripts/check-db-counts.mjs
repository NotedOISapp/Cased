import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [showRows] = await conn.query("SELECT COUNT(*) as cnt FROM podcast_shows");
const [epRows] = await conn.query("SELECT COUNT(*) as cnt FROM podcast_episodes");
const [caseShowRows] = await conn.query("SELECT COUNT(*) as cnt FROM case_shows");

console.log("=".repeat(50));
console.log("Database Counts");
console.log("=".repeat(50));
console.log(`Podcast shows   : ${showRows[0].cnt}`);
console.log(`Podcast episodes: ${epRows[0].cnt}`);
console.log(`Case-show links : ${caseShowRows[0].cnt}`);

// Per-case episode count
const [perCase] = await conn.query(`
  SELECT c.title, COUNT(pe.id) as ep_count, COUNT(DISTINCT cs.showId) as show_count
  FROM cases c
  LEFT JOIN case_shows cs ON cs.caseId = c.id
  LEFT JOIN podcast_episodes pe ON pe.caseId = c.id
  GROUP BY c.id, c.title
  ORDER BY ep_count DESC
`);

console.log("\nPer-case breakdown:");
console.log("-".repeat(50));
for (const row of perCase) {
  const epStr = String(row.ep_count).padStart(3);
  const showStr = String(row.show_count).padStart(2);
  const icon = row.ep_count > 0 ? "✅" : "⚠️ ";
  console.log(`${icon} ${row.title.padEnd(38)} ${epStr} eps  ${showStr} shows`);
}
console.log("-".repeat(50));

await conn.end();
