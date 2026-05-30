ALTER TABLE `cases` MODIFY COLUMN `tags` text NOT NULL;--> statement-breakpoint
ALTER TABLE `cases` MODIFY COLUMN `crimeTypes` json NOT NULL;--> statement-breakpoint
ALTER TABLE `cases` MODIFY COLUMN `storyMechanics` json NOT NULL;--> statement-breakpoint
ALTER TABLE `cases` MODIFY COLUMN `coverImage` text NOT NULL;--> statement-breakpoint
ALTER TABLE `cases` MODIFY COLUMN `perfectFor` json;--> statement-breakpoint
ALTER TABLE `cases` MODIFY COLUMN `contentNotes` json;--> statement-breakpoint
ALTER TABLE `podcast_episodes` MODIFY COLUMN `contentTags` json;--> statement-breakpoint
ALTER TABLE `podcast_shows` MODIFY COLUMN `artworkUrl` text NOT NULL;--> statement-breakpoint
ALTER TABLE `podcast_shows` MODIFY COLUMN `applePodcastsUrl` text NOT NULL;--> statement-breakpoint
ALTER TABLE `podcast_shows` MODIFY COLUMN `spotifySearchUrl` text NOT NULL;--> statement-breakpoint
ALTER TABLE `podcast_shows` MODIFY COLUMN `rssFeedUrl` text NOT NULL;--> statement-breakpoint
ALTER TABLE `podcast_shows` MODIFY COLUMN `genre` varchar(128) NOT NULL DEFAULT 'True Crime';