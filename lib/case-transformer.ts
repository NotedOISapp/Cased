/**
 * Transforms raw database Case rows into the TruecrimeCase shape
 * expected by the app's components, filter utilities, and context.
 *
 * The DB stores some fields differently from the app type:
 *  - tags: comma-separated string → string[]
 *  - crimeTypes: JSON string (from DB) or already-parsed array
 *  - storyMechanics: JSON string or already-parsed array
 *  - perfectFor: JSON string or already-parsed array
 *  - contentNotes: JSON string or already-parsed array
 *  - podcasts: not stored in the cases table — populated separately
 */

import type { Case } from "@/drizzle/schema";
import type { TruecrimeCase, CrimeType, StoryMechanic, PodcastEntry } from "@/lib/types";

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string" && value.trim()) {
    // Could be comma-separated or JSON
    if (value.startsWith("[")) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // fall through to comma split
      }
    }
    return value.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export function dbCaseToAppCase(
  row: Case,
  podcasts: PodcastEntry[] = []
): TruecrimeCase {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    tags: parseTags(row.tags),
    caseStatus: row.caseStatus,
    crimeTypes: parseJsonArray<CrimeType>(row.crimeTypes),
    era: row.era,
    contentIntensity: row.contentIntensity,
    storyMechanics: parseJsonArray<StoryMechanic>(row.storyMechanics),
    recentDevelopments: row.recentDevelopments,
    lastDevelopmentDate: row.lastDevelopmentDate ?? undefined,
    coverImage: row.coverImage,
    whyWeLoveIt: row.whyWeLoveIt ?? undefined,
    perfectFor: parseJsonArray<string>(row.perfectFor),
    contentNotes: parseJsonArray<string>(row.contentNotes),
    hasChildVictim: row.hasChildVictim,
    isFamilicide: row.isFamilicide,
    hasSexualAssault: row.hasSexualAssault,
    hasSuicide: row.hasSuicide,
    hasDomesticViolence: row.hasDomesticViolence,
    hasPsychManipulation: row.hasPsychManipulation,
    podcasts,
  };
}

export function dbCasesToAppCases(
  rows: Case[],
  podcastMap: Record<string, PodcastEntry[]> = {}
): TruecrimeCase[] {
  return rows.map((row) => dbCaseToAppCase(row, podcastMap[row.id] ?? []));
}
