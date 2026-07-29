CREATE TABLE `model_routes` (
	`id` text PRIMARY KEY NOT NULL,
	`stage` text NOT NULL,
	`route_stage` text,
	`senior_essay_type` text,
	`api_config_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`api_config_id`) REFERENCES `api_configs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `model_routes_stage_unique_idx` ON `model_routes` (`stage`, `route_stage`, `senior_essay_type`);--> statement-breakpoint
CREATE INDEX `model_routes_config_idx` ON `model_routes` (`api_config_id`);--> statement-breakpoint
ALTER TABLE `schools` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
CREATE INDEX `classes_stage_idx` ON `classes` (`stage`);--> statement-breakpoint
ALTER TABLE `essay_tasks` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
ALTER TABLE `essay_tasks` ADD `senior_essay_type` text;--> statement-breakpoint
ALTER TABLE `essay_tasks` ADD `reading_passage` text;--> statement-breakpoint
ALTER TABLE `essay_tasks` ADD `continuation_paragraph_starts` text;--> statement-breakpoint
CREATE INDEX `essay_tasks_class_status_idx` ON `essay_tasks` (`class_id`,`status`);--> statement-breakpoint
CREATE INDEX `essay_tasks_creator_idx` ON `essay_tasks` (`created_by`);--> statement-breakpoint
CREATE INDEX `essay_tasks_due_date_idx` ON `essay_tasks` (`due_date`);--> statement-breakpoint
CREATE INDEX `essay_tasks_stage_idx` ON `essay_tasks` (`stage`);--> statement-breakpoint
CREATE INDEX `essay_tasks_stage_type_idx` ON `essay_tasks` (`stage`,`senior_essay_type`);--> statement-breakpoint
ALTER TABLE `essays` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
CREATE INDEX `essays_stage_idx` ON `essays` (`stage`);--> statement-breakpoint
CREATE INDEX `essays_student_status_idx` ON `essays` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `essays_student_submitted_idx` ON `essays` (`student_id`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `essays_task_status_idx` ON `essays` (`task_id`,`status`);--> statement-breakpoint
CREATE INDEX `essays_status_submitted_idx` ON `essays` (`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `essays_stage_status_idx` ON `essays` (`stage`,`status`);--> statement-breakpoint
ALTER TABLE `corrections` ADD `topic_adherence_score` real;--> statement-breakpoint
ALTER TABLE `corrections` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
ALTER TABLE `corrections` ADD `senior_essay_type` text;--> statement-breakpoint
CREATE INDEX `corrections_score_tier_idx` ON `corrections` (`score_tier`);--> statement-breakpoint
CREATE INDEX `corrections_created_at_idx` ON `corrections` (`created_at`);--> statement-breakpoint
CREATE INDEX `corrections_stage_idx` ON `corrections` (`stage`);--> statement-breakpoint
ALTER TABLE `teaching_resources` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
CREATE INDEX `teaching_resources_stage_idx` ON `teaching_resources` (`stage`);--> statement-breakpoint
ALTER TABLE `question_bank` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
ALTER TABLE `question_bank` ADD `senior_essay_type` text;--> statement-breakpoint
CREATE INDEX `question_bank_stage_idx` ON `question_bank` (`stage`);--> statement-breakpoint
ALTER TABLE `practice_exercises` ADD `stage` text DEFAULT 'junior' NOT NULL;--> statement-breakpoint
CREATE INDEX `practice_exercises_stage_idx` ON `practice_exercises` (`stage`);