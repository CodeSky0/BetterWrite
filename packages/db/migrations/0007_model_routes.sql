CREATE TABLE IF NOT EXISTS `model_routes` (
	`id` text PRIMARY KEY NOT NULL,
	`stage` text NOT NULL,
	`api_config_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`api_config_id`) REFERENCES `api_configs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `model_routes_stage_unique` ON `model_routes` (`stage`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `model_routes_config_idx` ON `model_routes` (`api_config_id`);
