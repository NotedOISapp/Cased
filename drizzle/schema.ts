import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ============================================================
// Auth — existing table, do not modify
// ============================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// Cases — canonical case objects (the core entity)
// ============================================================

export const cases = mysqlTable("cases", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. "case_idaho4"
  title: varchar("title", { length: 255 }).notNull(),
  /** Spoiler-free 1-2 sentence summary. Never names the perpetrator. */
  summary: text("summary").notNull(),
  /** Comma-separated display tags e.g. "Cold Case,DNA Evidence" */
  tags: text("tags").notNull(),

  // ---- Case metadata ----
  caseStatus: mysqlEnum("caseStatus", [
    "Solved",
    "Unsolved",
    "Ongoing",
    "WrongfulConviction",
    "ColdCase",
  ]).notNull(),
  /** JSON array of CrimeType strings */
  crimeTypes: json("crimeTypes").$type<string[]>().notNull().$defaultFn(() => []),
  era: mysqlEnum("era", [
    "Pre1990",
    "1990s",
    "2000s",
    "2010s",
    "Recent",
  ]).notNull(),
  contentIntensity: mysqlEnum("contentIntensity", [
    "LightDiscussion",
    "GraphicDetails",
    "CourtFocused",
  ]).notNull(),
  /** JSON array of StoryMechanic strings */
  storyMechanics: json("storyMechanics").$type<string[]>().notNull().$defaultFn(() => []),

  // ---- Safety flags (hard filters) ----
  hasChildVictim: boolean("hasChildVictim").notNull().default(false),
  isFamilicide: boolean("isFamilicide").notNull().default(false),
  hasSexualAssault: boolean("hasSexualAssault").notNull().default(false),
  hasSuicide: boolean("hasSuicide").notNull().default(false),
  /** Soft warning tag — NOT a hard filter. Present in too many cases to block by default. */
  hasDomesticViolence: boolean("hasDomesticViolence").notNull().default(false),
  hasPsychManipulation: boolean("hasPsychManipulation").notNull().default(false),

  // ---- Recent developments ----
  recentDevelopments: boolean("recentDevelopments").notNull().default(false),
  lastDevelopmentDate: varchar("lastDevelopmentDate", { length: 32 }),

  // ---- Editorial / display ----
  coverImage: text("coverImage").notNull(),
  whyWeLoveIt: text("whyWeLoveIt"),
  /** JSON array of strings e.g. ["Late night listening", "Cold case obsessives"] */
  perfectFor: json("perfectFor").$type<string[]>().$defaultFn(() => []),
  /** JSON array of content note strings */
  contentNotes: json("contentNotes").$type<string[]>().$defaultFn(() => []),

  // ---- Ingestion tracking ----
  /** Whether this case was hand-verified by a curator (vs. auto-ingested) */
  curatorVerified: boolean("curatorVerified").notNull().default(false),
  /** Timestamp of last podcast discovery run for this case */
  lastPodcastSyncAt: timestamp("lastPodcastSyncAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

// ============================================================
// Podcast Shows — one row per podcast series
// ============================================================

export const podcastShows = mysqlTable("podcast_shows", {
  id: int("id").autoincrement().primaryKey(),
  /** iTunes collection ID — stable external identifier */
  itunesId: int("itunesId").unique(),
  name: varchar("name", { length: 255 }).notNull(),
  artistName: varchar("artistName", { length: 255 }).notNull().default(""),
  artworkUrl: text("artworkUrl").notNull(),
  applePodcastsUrl: text("applePodcastsUrl").notNull(),
  spotifySearchUrl: text("spotifySearchUrl").notNull(),
  rssFeedUrl: text("rssFeedUrl").notNull(),
  genre: varchar("genre", { length: 128 }).notNull().default("True Crime"),

  // ---- Editorial metadata (curated once per show) ----
  hostType: mysqlEnum("hostType", [
    "solo_female",
    "solo_male",
    "two_female",
    "husband_wife",
    "mixed",
    "rotating",
    "unknown",
  ]).notNull().default("unknown"),
  banterLevel: mysqlEnum("banterLevel", [
    "none",
    "low",
    "medium",
    "high",
    "unknown",
  ]).notNull().default("unknown"),
  tone: mysqlEnum("tone", [
    "investigative",
    "narrative",
    "court",
    "interview",
    "mixed",
    "unknown",
  ]).notNull().default("unknown"),
  averageEpisodeLengthMinutes: int("averageEpisodeLengthMinutes"),
  isActive: boolean("isActive").notNull().default(true),

  /** Whether editorial metadata has been manually reviewed */
  editorialReviewed: boolean("editorialReviewed").notNull().default(false),
  lastRssFetchAt: timestamp("lastRssFetchAt"),
  totalEpisodeCount: int("totalEpisodeCount").notNull().default(0),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PodcastShow = typeof podcastShows.$inferSelect;
export type InsertPodcastShow = typeof podcastShows.$inferInsert;

// ============================================================
// Case–Show join — which shows cover which cases
// ============================================================

export const caseShows = mysqlTable("case_shows", {
  id: int("id").autoincrement().primaryKey(),
  caseId: varchar("caseId", { length: 64 }).notNull(),
  showId: int("showId").notNull(),
  /** How many episodes in this show cover this case */
  episodeCount: int("episodeCount").notNull().default(0),
  coverageDepth: mysqlEnum("coverageDepth", [
    "Overview",
    "InDepth",
    "Exhaustive",
  ]).notNull().default("Overview"),
  timeCommitment: mysqlEnum("timeCommitment", [
    "Under1Hr",
    "1to3Hrs",
    "3PlusHrs",
  ]).notNull().default("Under1Hr"),
  narrativeStyle: mysqlEnum("narrativeStyle", [
    "StraightRetelling",
    "SlowBuild",
    "EpisodeByEpisode",
    "Interview",
  ]).notNull().default("StraightRetelling"),
  tone: mysqlEnum("tone", [
    "Investigative",
    "Narrative",
    "CourtFocused",
    "InterviewBased",
  ]).notNull().default("Narrative"),
  format: mysqlEnum("format", ["LongFormSeason", "Episodic"]),
  includesRecentUpdates: boolean("includesRecentUpdates").notNull().default(false),
  coverageEndDate: varchar("coverageEndDate", { length: 32 }),
  startHereNote: text("startHereNote"),
  /** Curator-written note for why this show is recommended for this case */
  curatorNote: text("curatorNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaseShow = typeof caseShows.$inferSelect;
export type InsertCaseShow = typeof caseShows.$inferInsert;

// ============================================================
// Podcast Episodes — individual episode records
// ============================================================

export const podcastEpisodes = mysqlTable("podcast_episodes", {
  id: int("id").autoincrement().primaryKey(),
  showId: int("showId").notNull(),
  /** Linked case — null until LLM extraction confirms the match */
  caseId: varchar("caseId", { length: 64 }),
  /** Original RSS GUID — used for deduplication */
  rssGuid: varchar("rssGuid", { length: 512 }).unique(),

  // ---- Original RSS data ----
  titleOriginal: varchar("titleOriginal", { length: 512 }).notNull(),
  descriptionOriginal: text("descriptionOriginal"),
  publishDate: timestamp("publishDate"),
  durationSeconds: int("durationSeconds"),
  audioUrl: text("audioUrl"),
  episodeUrl: text("episodeUrl"),

  // ---- LLM-enriched data (populated after extraction job) ----
  titleClean: varchar("titleClean", { length: 512 }),
  descriptionClean: text("descriptionClean"),
  storyPosition: mysqlEnum("storyPosition", [
    "background",
    "investigation",
    "trial",
    "verdict",
    "update",
    "unknown",
  ]).notNull().default("unknown"),
  banterScore: int("banterScore"), // 0-100; 0 = no banter, 100 = all banter
  /** JSON array of content tag strings */
  contentTags: json("contentTags").$type<string[]>().$defaultFn(() => []),
  // Content tag values: "911call" | "familyInterview" | "expertTestimony" | "graphicAudio" | "primarySource" | "courtAudio"
  hasTranscript: boolean("hasTranscript").notNull().default(false),
  transcriptUrl: text("transcriptUrl"),

  // ---- Ingestion tracking ----
  llmProcessed: boolean("llmProcessed").notNull().default(false),
  llmProcessedAt: timestamp("llmProcessedAt"),
  /** 0-100 confidence that caseId link is correct */
  caseMatchConfidence: int("caseMatchConfidence"),
  /** Flagged for human review if confidence < 80 */
  needsReview: boolean("needsReview").notNull().default(false),
  reviewedByHuman: boolean("reviewedByHuman").notNull().default(false),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type InsertPodcastEpisode = typeof podcastEpisodes.$inferInsert;

// ============================================================
// User saved cases — cross-device sync (optional, requires auth)
// ============================================================

export const userSavedCases = mysqlTable("user_saved_cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: varchar("caseId", { length: 64 }).notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type UserSavedCase = typeof userSavedCases.$inferSelect;
export type InsertUserSavedCase = typeof userSavedCases.$inferInsert;

// ============================================================
// Ingestion log — audit trail for pipeline runs
// ============================================================

export const ingestionLog = mysqlTable("ingestion_log", {
  id: int("id").autoincrement().primaryKey(),
  /** "podcast_discovery" | "rss_fetch" | "llm_extraction" | "case_link" */
  jobType: varchar("jobType", { length: 64 }).notNull(),
  caseId: varchar("caseId", { length: 64 }),
  showId: int("showId"),
  status: mysqlEnum("status", ["pending", "running", "success", "error"]).notNull().default("pending"),
  message: text("message"),
  itemsProcessed: int("itemsProcessed").notNull().default(0),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type IngestionLog = typeof ingestionLog.$inferSelect;
export type InsertIngestionLog = typeof ingestionLog.$inferInsert;

// ============================================================
// Case Aliases
// ============================================================

export const caseAliases = mysqlTable("case_aliases", {
  id: int("id").autoincrement().primaryKey(),
  caseId: varchar("caseId", { length: 64 }).notNull(),
  alias: varchar("alias", { length: 255 }).notNull(),
  priority: int("priority").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaseAlias = typeof caseAliases.$inferSelect;
export type InsertCaseAlias = typeof caseAliases.$inferInsert;
