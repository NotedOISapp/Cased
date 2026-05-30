CREATE TABLE `case_shows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` varchar(64) NOT NULL,
	`showId` int NOT NULL,
	`episodeCount` int NOT NULL DEFAULT 0,
	`coverageDepth` enum('Overview','InDepth','Exhaustive') NOT NULL DEFAULT 'Overview',
	`timeCommitment` enum('Under1Hr','1to3Hrs','3PlusHrs') NOT NULL DEFAULT 'Under1Hr',
	`narrativeStyle` enum('StraightRetelling','SlowBuild','EpisodeByEpisode','Interview') NOT NULL DEFAULT 'StraightRetelling',
	`tone` enum('Investigative','Narrative','CourtFocused','InterviewBased') NOT NULL DEFAULT 'Narrative',
	`format` enum('LongFormSeason','Episodic'),
	`includesRecentUpdates` boolean NOT NULL DEFAULT false,
	`coverageEndDate` varchar(32),
	`startHereNote` text,
	`curatorNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_shows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`tags` text NOT NULL DEFAULT (''),
	`caseStatus` enum('Solved','Unsolved','Ongoing','WrongfulConviction','ColdCase') NOT NULL,
	`crimeTypes` json NOT NULL DEFAULT ('[]'),
	`era` enum('Pre1990','1990s','2000s','2010s','Recent') NOT NULL,
	`contentIntensity` enum('LightDiscussion','GraphicDetails','CourtFocused') NOT NULL,
	`storyMechanics` json NOT NULL DEFAULT ('[]'),
	`hasChildVictim` boolean NOT NULL DEFAULT false,
	`isFamilicide` boolean NOT NULL DEFAULT false,
	`hasSexualAssault` boolean NOT NULL DEFAULT false,
	`hasSuicide` boolean NOT NULL DEFAULT false,
	`hasDomesticViolence` boolean NOT NULL DEFAULT false,
	`hasPsychManipulation` boolean NOT NULL DEFAULT false,
	`recentDevelopments` boolean NOT NULL DEFAULT false,
	`lastDevelopmentDate` varchar(32),
	`coverImage` text NOT NULL DEFAULT (''),
	`whyWeLoveIt` text,
	`perfectFor` json DEFAULT ('[]'),
	`contentNotes` json DEFAULT ('[]'),
	`curatorVerified` boolean NOT NULL DEFAULT false,
	`lastPodcastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` varchar(64) NOT NULL,
	`caseId` varchar(64),
	`showId` int,
	`status` enum('pending','running','success','error') NOT NULL DEFAULT 'pending',
	`message` text,
	`itemsProcessed` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `ingestion_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `podcast_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`showId` int NOT NULL,
	`caseId` varchar(64),
	`rssGuid` varchar(512),
	`titleOriginal` varchar(512) NOT NULL,
	`descriptionOriginal` text,
	`publishDate` timestamp,
	`durationSeconds` int,
	`audioUrl` text,
	`episodeUrl` text,
	`titleClean` varchar(512),
	`descriptionClean` text,
	`storyPosition` enum('background','investigation','trial','verdict','update','unknown') NOT NULL DEFAULT 'unknown',
	`banterScore` int,
	`contentTags` json DEFAULT ('[]'),
	`hasTranscript` boolean NOT NULL DEFAULT false,
	`transcriptUrl` text,
	`llmProcessed` boolean NOT NULL DEFAULT false,
	`llmProcessedAt` timestamp,
	`caseMatchConfidence` int,
	`needsReview` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `podcast_episodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `podcast_episodes_rssGuid_unique` UNIQUE(`rssGuid`)
);
--> statement-breakpoint
CREATE TABLE `podcast_shows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itunesId` int,
	`name` varchar(255) NOT NULL,
	`artistName` varchar(255) NOT NULL DEFAULT '',
	`artworkUrl` text NOT NULL DEFAULT (''),
	`applePodcastsUrl` text NOT NULL DEFAULT (''),
	`spotifySearchUrl` text NOT NULL DEFAULT (''),
	`rssFeedUrl` text NOT NULL DEFAULT (''),
	`genre` varchar(128) NOT NULL DEFAULT '',
	`hostType` enum('solo_female','solo_male','two_female','husband_wife','mixed','rotating','unknown') NOT NULL DEFAULT 'unknown',
	`banterLevel` enum('none','low','medium','high','unknown') NOT NULL DEFAULT 'unknown',
	`tone` enum('investigative','narrative','court','interview','mixed','unknown') NOT NULL DEFAULT 'unknown',
	`averageEpisodeLengthMinutes` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`editorialReviewed` boolean NOT NULL DEFAULT false,
	`lastRssFetchAt` timestamp,
	`totalEpisodeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `podcast_shows_id` PRIMARY KEY(`id`),
	CONSTRAINT `podcast_shows_itunesId_unique` UNIQUE(`itunesId`)
);
--> statement-breakpoint
CREATE TABLE `user_saved_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` varchar(64) NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_saved_cases_id` PRIMARY KEY(`id`)
);
