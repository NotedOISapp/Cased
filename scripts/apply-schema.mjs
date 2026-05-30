/**
 * Direct schema application script.
 * Applies all missing tables using CREATE TABLE IF NOT EXISTS.
 * Safe to run multiple times.
 */
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const conn = await mysql.createConnection(url);

const statements = [
  // cases
  `CREATE TABLE IF NOT EXISTS \`cases\` (
    \`id\` varchar(64) NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`summary\` text NOT NULL,
    \`tags\` text NOT NULL,
    \`caseStatus\` enum('Solved','Unsolved','Ongoing','WrongfulConviction','ColdCase') NOT NULL,
    \`crimeTypes\` json NOT NULL,
    \`era\` enum('Pre1990','1990s','2000s','2010s','Recent') NOT NULL,
    \`contentIntensity\` enum('LightDiscussion','GraphicDetails','CourtFocused') NOT NULL,
    \`storyMechanics\` json NOT NULL,
    \`hasChildVictim\` boolean NOT NULL DEFAULT false,
    \`isFamilicide\` boolean NOT NULL DEFAULT false,
    \`hasSexualAssault\` boolean NOT NULL DEFAULT false,
    \`hasSuicide\` boolean NOT NULL DEFAULT false,
    \`hasDomesticViolence\` boolean NOT NULL DEFAULT false,
    \`hasPsychManipulation\` boolean NOT NULL DEFAULT false,
    \`recentDevelopments\` boolean NOT NULL DEFAULT false,
    \`lastDevelopmentDate\` varchar(32),
    \`coverImage\` text NOT NULL,
    \`whyWeLoveIt\` text,
    \`perfectFor\` json,
    \`contentNotes\` json,
    \`curatorVerified\` boolean NOT NULL DEFAULT false,
    \`lastPodcastSyncAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`cases_id\` PRIMARY KEY(\`id\`)
  )`,

  // podcast_shows
  `CREATE TABLE IF NOT EXISTS \`podcast_shows\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`itunesId\` int,
    \`name\` varchar(255) NOT NULL,
    \`artistName\` varchar(255) NOT NULL DEFAULT '',
    \`artworkUrl\` text NOT NULL,
    \`applePodcastsUrl\` text NOT NULL,
    \`spotifySearchUrl\` text NOT NULL,
    \`rssFeedUrl\` text NOT NULL,
    \`genre\` varchar(128) NOT NULL DEFAULT 'True Crime',
    \`hostType\` enum('solo_female','solo_male','two_female','husband_wife','mixed','rotating','unknown') NOT NULL DEFAULT 'unknown',
    \`banterLevel\` enum('none','low','medium','high','unknown') NOT NULL DEFAULT 'unknown',
    \`tone\` enum('investigative','narrative','court','interview','mixed','unknown') NOT NULL DEFAULT 'unknown',
    \`averageEpisodeLengthMinutes\` int,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`editorialReviewed\` boolean NOT NULL DEFAULT false,
    \`lastRssFetchAt\` timestamp NULL,
    \`totalEpisodeCount\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`podcast_shows_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`podcast_shows_itunesId_unique\` UNIQUE(\`itunesId\`)
  )`,

  // podcast_episodes
  `CREATE TABLE IF NOT EXISTS \`podcast_episodes\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`showId\` int NOT NULL,
    \`caseId\` varchar(64),
    \`rssGuid\` varchar(512),
    \`titleOriginal\` varchar(512) NOT NULL,
    \`descriptionOriginal\` text,
    \`publishDate\` timestamp NULL,
    \`durationSeconds\` int,
    \`audioUrl\` text,
    \`episodeUrl\` text,
    \`titleClean\` varchar(512),
    \`descriptionClean\` text,
    \`storyPosition\` enum('background','investigation','trial','verdict','update','unknown') NOT NULL DEFAULT 'unknown',
    \`banterScore\` int,
    \`contentTags\` json,
    \`hasTranscript\` boolean NOT NULL DEFAULT false,
    \`transcriptUrl\` text,
    \`llmProcessed\` boolean NOT NULL DEFAULT false,
    \`llmProcessedAt\` timestamp NULL,
    \`caseMatchConfidence\` int,
    \`needsReview\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`podcast_episodes_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`podcast_episodes_rssGuid_unique\` UNIQUE(\`rssGuid\`)
  )`,

  // user_saved_cases
  `CREATE TABLE IF NOT EXISTS \`user_saved_cases\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`caseId\` varchar(64) NOT NULL,
    \`savedAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`user_saved_cases_id\` PRIMARY KEY(\`id\`)
  )`,

  // ingestion_log
  `CREATE TABLE IF NOT EXISTS \`ingestion_log\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`jobType\` varchar(64) NOT NULL,
    \`caseId\` varchar(64),
    \`showId\` int,
    \`status\` enum('pending','running','success','error') NOT NULL DEFAULT 'pending',
    \`message\` text,
    \`itemsProcessed\` int NOT NULL DEFAULT 0,
    \`startedAt\` timestamp NOT NULL DEFAULT (now()),
    \`completedAt\` timestamp NULL,
    CONSTRAINT \`ingestion_log_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of statements) {
  const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `([^`]+)`/)?.[1] ?? 'unknown';
  try {
    await conn.execute(sql);
    console.log(`✓ ${tableName}`);
  } catch (err) {
    console.error(`✗ ${tableName}: ${err.message}`);
  }
}

await conn.end();
console.log('Done.');
