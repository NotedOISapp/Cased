import { relations } from "drizzle-orm";
import {
  cases,
  caseShows,
  ingestionLog,
  podcastEpisodes,
  podcastShows,
  userSavedCases,
  users,
} from "./schema";

export const casesRelations = relations(cases, ({ many }) => ({
  caseShows: many(caseShows),
  episodes: many(podcastEpisodes),
  savedBy: many(userSavedCases),
}));

export const podcastShowsRelations = relations(podcastShows, ({ many }) => ({
  caseShows: many(caseShows),
  episodes: many(podcastEpisodes),
}));

export const caseShowsRelations = relations(caseShows, ({ one }) => ({
  case: one(cases, { fields: [caseShows.caseId], references: [cases.id] }),
  show: one(podcastShows, { fields: [caseShows.showId], references: [podcastShows.id] }),
}));

export const podcastEpisodesRelations = relations(podcastEpisodes, ({ one }) => ({
  show: one(podcastShows, { fields: [podcastEpisodes.showId], references: [podcastShows.id] }),
  case: one(cases, { fields: [podcastEpisodes.caseId], references: [cases.id] }),
}));

export const userSavedCasesRelations = relations(userSavedCases, ({ one }) => ({
  user: one(users, { fields: [userSavedCases.userId], references: [users.id] }),
  case: one(cases, { fields: [userSavedCases.caseId], references: [cases.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  savedCases: many(userSavedCases),
}));

export const ingestionLogRelations = relations(ingestionLog, ({ one }) => ({
  case: one(cases, { fields: [ingestionLog.caseId], references: [cases.id] }),
  show: one(podcastShows, { fields: [ingestionLog.showId], references: [podcastShows.id] }),
}));
