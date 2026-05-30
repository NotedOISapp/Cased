import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { cases, podcastEpisodes, podcastShows } from "../drizzle/schema";
import { desc, eq, and, gte } from "drizzle-orm";

export const coverageRouter = router({
  recent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const results = await db
        .select({
          caseTitle: cases.title,
          podcastName: podcastShows.name,
          episodeTitle: podcastEpisodes.titleOriginal,
          publishDate: podcastEpisodes.publishDate,
          duration: podcastEpisodes.durationSeconds,
          appleUrl: podcastShows.applePodcastsUrl,
          spotifyUrl: podcastShows.spotifySearchUrl,
          sourceUrl: podcastEpisodes.episodeUrl,
          matchConfidence: podcastEpisodes.caseMatchConfidence,
          reviewStatus: podcastEpisodes.needsReview,
          caseId: cases.id,
        })
        .from(podcastEpisodes)
        .leftJoin(cases, eq(podcastEpisodes.caseId, cases.id))
        .leftJoin(podcastShows, eq(podcastEpisodes.showId, podcastShows.id))
        .orderBy(desc(podcastEpisodes.createdAt))
        .limit(input.limit);
        
      return results;
    }),

  byCaseId: publicProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select({
          caseTitle: cases.title,
          podcastName: podcastShows.name,
          episodeTitle: podcastEpisodes.titleOriginal,
          publishDate: podcastEpisodes.publishDate,
          duration: podcastEpisodes.durationSeconds,
          appleUrl: podcastShows.applePodcastsUrl,
          spotifyUrl: podcastShows.spotifySearchUrl,
          sourceUrl: podcastEpisodes.episodeUrl,
          matchConfidence: podcastEpisodes.caseMatchConfidence,
          reviewStatus: podcastEpisodes.needsReview,
          caseId: cases.id,
        })
        .from(podcastEpisodes)
        .leftJoin(cases, eq(podcastEpisodes.caseId, cases.id))
        .leftJoin(podcastShows, eq(podcastEpisodes.showId, podcastShows.id))
        .where(
          and(
            eq(podcastEpisodes.caseId, input.caseId),
            eq(podcastEpisodes.needsReview, false),
            gte(podcastEpisodes.caseMatchConfidence, 80)
          )
        )
        .orderBy(desc(podcastEpisodes.publishDate));
        
      return results;
    }),

  needsReview: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select({
          id: podcastEpisodes.id,
          caseTitle: cases.title,
          podcastName: podcastShows.name,
          episodeTitle: podcastEpisodes.titleOriginal,
          publishDate: podcastEpisodes.publishDate,
          matchConfidence: podcastEpisodes.caseMatchConfidence,
          sourceUrl: podcastEpisodes.episodeUrl,
        })
        .from(podcastEpisodes)
        .leftJoin(cases, eq(podcastEpisodes.caseId, cases.id))
        .leftJoin(podcastShows, eq(podcastEpisodes.showId, podcastShows.id))
        .where(eq(podcastEpisodes.needsReview, true))
        .orderBy(desc(podcastEpisodes.createdAt))
        .limit(input.limit);
        
      return results;
    }),
});
