import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { runPodcastDiscovery } from "./podcast-ingestion";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================
  // Cases
  // ============================================================
  cases: router({
    /** Get all cases (for Explore screen) */
    list: publicProcedure.query(async () => {
      return db.getAllCases();
    }),

    /** Get a single case by ID */
    byId: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.getCaseById(input.id);
      }),

    /** Get podcast shows linked to a case */
    shows: publicProcedure
      .input(z.object({ caseId: z.string() }))
      .query(async ({ input }) => {
        return db.getShowsByCaseId(input.caseId);
      }),

    /** Get episodes linked to a case */
    episodes: publicProcedure
      .input(z.object({ caseId: z.string() }))
      .query(async ({ input }) => {
        return db.getEpisodesByCaseId(input.caseId);
      }),

    /** Get episodes with show metadata for the Case Detail screen */
    episodesWithShow: publicProcedure
      .input(z.object({ caseId: z.string() }))
      .query(async ({ input }) => {
        return db.getEpisodesWithShowByCaseId(input.caseId);
      }),
  }),

  // ============================================================
  // User saved cases (requires auth)
  // ============================================================
  saved: router({
    /** Get all case IDs saved by the current user */
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSavedCaseIds(ctx.user.id);
    }),

    /** Save a case */
    save: protectedProcedure
      .input(z.object({ caseId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.saveCase(ctx.user.id, input.caseId);
        return { success: true };
      }),

    /** Unsave a case */
    unsave: protectedProcedure
      .input(z.object({ caseId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.unsaveCase(ctx.user.id, input.caseId);
        return { success: true };
      }),
  }),

  // ============================================================
  // ============================================================
  // Admin case management
  // ============================================================
  admin: router({
    /** List all cases with full data for admin panel */
    listCases: adminProcedure.query(async () => {
      return db.getAllCases();
    }),

    /** Add a new case */
    addCase: adminProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string(),
          summary: z.string(),
          era: z.enum(["Pre1990", "1990s", "2000s", "2010s", "Recent"]),
          caseStatus: z.enum(["Solved", "Unsolved", "Ongoing", "WrongfulConviction", "ColdCase"]),
          contentIntensity: z.enum(["LightDiscussion", "GraphicDetails", "CourtFocused"]).default("LightDiscussion"),
          crimeTypes: z.array(z.string()).default([]),
          storyMechanics: z.array(z.string()).default([]),
          tags: z.string().default(""),
          coverImage: z.string().default(""),
          contentNotes: z.array(z.string()).default([]),
          hasChildVictim: z.boolean().default(false),
          isFamilicide: z.boolean().default(false),
          hasSexualAssault: z.boolean().default(false),
          hasSuicide: z.boolean().default(false),
          hasDomesticViolence: z.boolean().default(false),
          hasPsychManipulation: z.boolean().default(false),
          whyWeLoveIt: z.string().optional(),
          perfectFor: z.array(z.string()).default([]),
          recentDevelopments: z.boolean().default(false),
          curatorVerified: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        await db.upsertCase(input as any);
        return { success: true, id: input.id };
      }),

    /** Update an existing case */
    updateCase: adminProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          summary: z.string().optional(),
          era: z.enum(["Pre1990", "1990s", "2000s", "2010s", "Recent"]).optional(),
          caseStatus: z.enum(["Solved", "Unsolved", "Ongoing", "WrongfulConviction", "ColdCase"]).optional(),
          contentIntensity: z.enum(["LightDiscussion", "GraphicDetails", "CourtFocused"]).optional(),
          crimeTypes: z.array(z.string()).optional(),
          storyMechanics: z.array(z.string()).optional(),
          tags: z.string().optional(),
          coverImage: z.string().optional(),
          contentNotes: z.array(z.string()).optional(),
          hasChildVictim: z.boolean().optional(),
          isFamilicide: z.boolean().optional(),
          hasSexualAssault: z.boolean().optional(),
          hasSuicide: z.boolean().optional(),
          hasDomesticViolence: z.boolean().optional(),
          hasPsychManipulation: z.boolean().optional(),
          whyWeLoveIt: z.string().optional(),
          perfectFor: z.array(z.string()).optional(),
          recentDevelopments: z.boolean().optional(),
          curatorVerified: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await db.getCaseById(input.id);
        if (!existing) throw new Error(`Case ${input.id} not found`);
        const merged = { ...existing, ...input } as any;
        await db.upsertCase(merged);
        return { success: true };
      }),

    /** Trigger podcast discovery for a case */
    runDiscovery: adminProcedure
      .input(z.object({ caseId: z.string(), caseTitle: z.string() }))
      .mutation(async ({ input }) => {
        const result = await runPodcastDiscovery(input.caseId, input.caseTitle);
        return result;
      }),
  }),

  // ============================================================
  // Ingestion pipeline (admin-only)
  // ============================================================
  ingestion: router({
    /**
     * Trigger podcast discovery for a single case.
     * Searches iTunes, parses RSS feeds, stores shows + episodes.
     */
    discoverPodcasts: adminProcedure
      .input(z.object({ caseId: z.string(), caseTitle: z.string() }))
      .mutation(async ({ input }) => {
        const result = await runPodcastDiscovery(input.caseId, input.caseTitle);
        return result;
      }),

    /**
     * Run discovery for all cases that have never been synced.
     * Processes up to 5 cases per call to avoid timeouts.
     */
    discoverAll: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(15).default(5) }))
      .mutation(async ({ input }) => {
        const allCases = await db.getAllCases();
        const unsynced = allCases
          .filter((c) => !c.lastPodcastSyncAt)
          .slice(0, input.limit);

        const results = [];
        for (const c of unsynced) {
          const r = await runPodcastDiscovery(c.id, c.title);
          results.push(r);
          // Small delay between cases to be polite to iTunes API
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        return {
          processed: results.length,
          results,
        };
      }),

    /** Get recent ingestion log entries */
    logs: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        return db.getRecentIngestionLogs(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
