import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ============================================================
// Cases
// ============================================================

import {
  Case,
  InsertCase,
  InsertCaseShow,
  InsertIngestionLog,
  InsertPodcastEpisode,
  InsertPodcastShow,
  caseShows,
  cases,
  ingestionLog,
  podcastEpisodes,
  podcastShows,
  userSavedCases,
} from "../drizzle/schema";
import { and, desc } from "drizzle-orm";

export async function getAllCases(): Promise<Case[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases).orderBy(cases.title);
}

export async function getCaseById(id: string): Promise<Case | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result[0] ?? null;
}

export async function upsertCase(data: InsertCase): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(cases)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        title: data.title,
        summary: data.summary,
        tags: data.tags,
        caseStatus: data.caseStatus,
        crimeTypes: data.crimeTypes,
        era: data.era,
        contentIntensity: data.contentIntensity,
        storyMechanics: data.storyMechanics,
        hasChildVictim: data.hasChildVictim,
        isFamilicide: data.isFamilicide,
        hasSexualAssault: data.hasSexualAssault,
        hasSuicide: data.hasSuicide,
        hasDomesticViolence: data.hasDomesticViolence,
        hasPsychManipulation: data.hasPsychManipulation,
        recentDevelopments: data.recentDevelopments,
        lastDevelopmentDate: data.lastDevelopmentDate,
        coverImage: data.coverImage,
        whyWeLoveIt: data.whyWeLoveIt,
        perfectFor: data.perfectFor,
        contentNotes: data.contentNotes,
        updatedAt: new Date(),
      },
    });
}

export async function markCasePodcastSynced(caseId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(cases)
    .set({ lastPodcastSyncAt: new Date() })
    .where(eq(cases.id, caseId));
}

// ============================================================
// Podcast Shows
// ============================================================

export async function getShowByItunesId(itunesId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(podcastShows)
    .where(eq(podcastShows.itunesId, itunesId))
    .limit(1);
  return result[0] ?? null;
}

export async function getShowByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(podcastShows)
    .where(eq(podcastShows.name, name))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertPodcastShow(data: InsertPodcastShow): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalise itunesId: treat 0 as null to avoid UNIQUE collisions
  const normalised = { ...data, itunesId: data.itunesId || null };

  // If no itunesId, check by name first to avoid duplicate inserts
  if (!normalised.itunesId) {
    const byName = await getShowByName(normalised.name);
    if (byName) {
      // Update artwork / URLs in case they changed
      await db
        .update(podcastShows)
        .set({
          artworkUrl: normalised.artworkUrl,
          applePodcastsUrl: normalised.applePodcastsUrl || byName.applePodcastsUrl,
          spotifySearchUrl: normalised.spotifySearchUrl || byName.spotifySearchUrl,
          rssFeedUrl: normalised.rssFeedUrl || byName.rssFeedUrl,
          totalEpisodeCount: normalised.totalEpisodeCount ?? byName.totalEpisodeCount,
          updatedAt: new Date(),
        })
        .where(eq(podcastShows.id, byName.id));
      return byName.id;
    }
  }

  const result = await db
    .insert(podcastShows)
    .values(normalised)
    .onDuplicateKeyUpdate({
      set: {
        name: normalised.name,
        artistName: normalised.artistName,
        artworkUrl: normalised.artworkUrl,
        applePodcastsUrl: normalised.applePodcastsUrl,
        spotifySearchUrl: normalised.spotifySearchUrl,
        rssFeedUrl: normalised.rssFeedUrl,
        totalEpisodeCount: normalised.totalEpisodeCount,
        updatedAt: new Date(),
      },
    });
  const rawResult = result as unknown as { insertId: number };
  if (rawResult.insertId) return rawResult.insertId;
  // Fallback lookup: try itunesId first, then name
  if (normalised.itunesId) {
    const existing = await getShowByItunesId(normalised.itunesId);
    if (existing) return existing.id;
  }
  const byName = await getShowByName(normalised.name);
  return byName!.id;
}

export async function getShowsByCaseId(caseId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      show: podcastShows,
      caseShow: caseShows,
    })
    .from(caseShows)
    .innerJoin(podcastShows, eq(caseShows.showId, podcastShows.id))
    .where(eq(caseShows.caseId, caseId))
    .orderBy(desc(caseShows.episodeCount));
}

// ============================================================
// Case-Show join
// ============================================================

export async function upsertCaseShow(data: InsertCaseShow): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(caseShows)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        episodeCount: data.episodeCount,
        includesRecentUpdates: data.includesRecentUpdates,
        coverageEndDate: data.coverageEndDate,
      },
    });
}

export async function getCaseShowExists(caseId: string, showId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: caseShows.id })
    .from(caseShows)
    .where(and(eq(caseShows.caseId, caseId), eq(caseShows.showId, showId)))
    .limit(1);
  return result.length > 0;
}

// ============================================================
// Podcast Episodes
// ============================================================

export async function upsertPodcastEpisode(data: InsertPodcastEpisode): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(podcastEpisodes)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        titleOriginal: data.titleOriginal,
        descriptionOriginal: data.descriptionOriginal,
        publishDate: data.publishDate,
        durationSeconds: data.durationSeconds,
        audioUrl: data.audioUrl,
        episodeUrl: data.episodeUrl,
        updatedAt: new Date(),
      },
    });
}

export async function getEpisodesByShowId(showId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.showId, showId))
    .orderBy(desc(podcastEpisodes.publishDate))
    .limit(50);
}

export async function getEpisodesByCaseId(caseId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.caseId, caseId))
    .orderBy(desc(podcastEpisodes.publishDate));
}

/**
 * Returns episodes for a case joined with their show metadata.
 * Used by the Case Detail screen to display live podcast data.
 */
export async function getEpisodesWithShowByCaseId(caseId: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      // Episode fields
      id: podcastEpisodes.id,
      showId: podcastEpisodes.showId,
      caseId: podcastEpisodes.caseId,
      rssGuid: podcastEpisodes.rssGuid,
      titleOriginal: podcastEpisodes.titleOriginal,
      titleClean: podcastEpisodes.titleClean,
      descriptionOriginal: podcastEpisodes.descriptionOriginal,
      publishDate: podcastEpisodes.publishDate,
      durationSeconds: podcastEpisodes.durationSeconds,
      audioUrl: podcastEpisodes.audioUrl,
      episodeUrl: podcastEpisodes.episodeUrl,
      storyPosition: podcastEpisodes.storyPosition,
      banterScore: podcastEpisodes.banterScore,
      contentTags: podcastEpisodes.contentTags,
      caseMatchConfidence: podcastEpisodes.caseMatchConfidence,
      // Show fields
      showName: podcastShows.name,
      showArtwork: podcastShows.artworkUrl,
      showHostType: podcastShows.hostType,
      showBanterLevel: podcastShows.banterLevel,
      showTone: podcastShows.tone,
      showApplePodcastsUrl: podcastShows.applePodcastsUrl,
      showSpotifyUrl: podcastShows.spotifySearchUrl,
      showTotalEpisodes: podcastShows.totalEpisodeCount,
    })
    .from(podcastEpisodes)
    .innerJoin(podcastShows, eq(podcastEpisodes.showId, podcastShows.id))
    .where(eq(podcastEpisodes.caseId, caseId))
    .orderBy(desc(podcastEpisodes.publishDate));
  return rows;
}

export async function getUnprocessedEpisodes(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.llmProcessed, false))
    .limit(limit);
}

// ============================================================
// User saved cases
// ============================================================

export async function getUserSavedCaseIds(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ caseId: userSavedCases.caseId })
    .from(userSavedCases)
    .where(eq(userSavedCases.userId, userId));
  return rows.map((r) => r.caseId);
}

export async function saveCase(userId: number, caseId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(userSavedCases)
    .values({ userId, caseId })
    .onDuplicateKeyUpdate({ set: { savedAt: new Date() } });
}

export async function unsaveCase(userId: number, caseId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(userSavedCases)
    .where(
      and(eq(userSavedCases.userId, userId), eq(userSavedCases.caseId, caseId))
    );
}

// ============================================================
// Device saved cases (no auth required — uses persistent device UUID)
// ============================================================

export async function getDeviceSavedCaseIds(deviceId: string): Promise<string[]> {
  if (!process.env.DATABASE_URL) return [];
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await conn.execute(
      "SELECT caseId FROM device_saved_cases WHERE deviceId = ?",
      [deviceId]
    ) as [Array<{ caseId: string }>, unknown];
    return rows.map((r) => r.caseId);
  } finally {
    await conn.end();
  }
}

export async function deviceSaveCase(deviceId: string, caseId: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await conn.execute(
      "INSERT INTO device_saved_cases (deviceId, caseId) VALUES (?, ?) ON DUPLICATE KEY UPDATE savedAt = CURRENT_TIMESTAMP",
      [deviceId, caseId]
    );
  } finally {
    await conn.end();
  }
}

export async function deviceUnsaveCase(deviceId: string, caseId: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await conn.execute(
      "DELETE FROM device_saved_cases WHERE deviceId = ? AND caseId = ?",
      [deviceId, caseId]
    );
  } finally {
    await conn.end();
  }
}

// ============================================================
// Ingestion log
// ============================================================

export async function logIngestionStart(
  data: Omit<InsertIngestionLog, "status" | "startedAt">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ingestionLog).values({
    ...data,
    status: "running",
    startedAt: new Date(),
  });
  return (result as unknown as { insertId: number }).insertId;
}

export async function logIngestionComplete(
  id: number,
  status: "success" | "error",
  message?: string,
  itemsProcessed?: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(ingestionLog)
    .set({
      status,
      message: message ?? null,
      itemsProcessed: itemsProcessed ?? 0,
      completedAt: new Date(),
    })
    .where(eq(ingestionLog.id, id));
}

export async function getRecentIngestionLogs(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ingestionLog)
    .orderBy(desc(ingestionLog.startedAt))
    .limit(limit);
}
