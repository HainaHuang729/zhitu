CREATE TABLE `ai_quota` (
	`bucket` text PRIMARY KEY NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
