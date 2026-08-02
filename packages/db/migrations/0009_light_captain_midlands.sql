CREATE TABLE `model_essay_imitations` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`student_id` text NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`word_count` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`score` integer,
	`feedback` text DEFAULT '{}',
	`teacher_comment` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `teaching_resources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `model_essay_imitations_resource_idx` ON `model_essay_imitations` (`resource_id`);--> statement-breakpoint
CREATE INDEX `model_essay_imitations_student_idx` ON `model_essay_imitations` (`student_id`);--> statement-breakpoint
CREATE TABLE `essay_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`essay_id` text NOT NULL,
	`student_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`word_count` integer NOT NULL,
	`score` real,
	`score_tier` text,
	`correction_id` text,
	`diff_summary` text DEFAULT '{}',
	`created_at` text NOT NULL,
	FOREIGN KEY (`essay_id`) REFERENCES `essays`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `essay_versions_essay_idx` ON `essay_versions` (`essay_id`);--> statement-breakpoint
CREATE INDEX `essay_versions_student_idx` ON `essay_versions` (`student_id`);--> statement-breakpoint
CREATE INDEX `essay_versions_essay_version_idx` ON `essay_versions` (`essay_id`,`version_number`);--> statement-breakpoint
CREATE TABLE `micro_exercise_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`answer` text NOT NULL,
	`score` integer,
	`is_correct` integer,
	`ai_feedback` text,
	`attempt_number` integer DEFAULT 1 NOT NULL,
	`duration_ms` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `micro_exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `micro_skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `micro_attempts_student_idx` ON `micro_exercise_attempts` (`student_id`);--> statement-breakpoint
CREATE INDEX `micro_attempts_exercise_idx` ON `micro_exercise_attempts` (`exercise_id`);--> statement-breakpoint
CREATE INDEX `micro_attempts_student_skill_idx` ON `micro_exercise_attempts` (`student_id`,`skill_id`);--> statement-breakpoint
CREATE TABLE `micro_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`skill_id` text NOT NULL,
	`level` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`instruction` text NOT NULL,
	`content` text NOT NULL,
	`answer_key` text,
	`ai_prompt_template` text,
	`max_score` integer DEFAULT 10 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `micro_skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `micro_exercises_skill_idx` ON `micro_exercises` (`skill_id`);--> statement-breakpoint
CREATE INDEX `micro_exercises_skill_level_idx` ON `micro_exercises` (`skill_id`,`level`);--> statement-breakpoint
CREATE TABLE `micro_skill_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`current_level` integer DEFAULT 0 NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`completed_exercises` integer DEFAULT 0 NOT NULL,
	`mastered_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `micro_skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `micro_progress_student_skill_idx` ON `micro_skill_progress` (`student_id`,`skill_id`);--> statement-breakpoint
CREATE INDEX `micro_progress_student_idx` ON `micro_skill_progress` (`student_id`);--> statement-breakpoint
CREATE TABLE `micro_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`icon` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `micro_skills_code_unique` ON `micro_skills` (`code`);--> statement-breakpoint
CREATE INDEX `micro_skills_category_idx` ON `micro_skills` (`category`);--> statement-breakpoint
CREATE INDEX `micro_skills_difficulty_idx` ON `micro_skills` (`difficulty`);--> statement-breakpoint
CREATE TABLE `writing_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`task_id` text,
	`class_id` text NOT NULL,
	`current_word_count` integer DEFAULT 0 NOT NULL,
	`elapsed_time_ms` integer DEFAULT 0 NOT NULL,
	`writing_speed` real DEFAULT 0,
	`is_stalled` integer DEFAULT false NOT NULL,
	`last_active_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` text NOT NULL,
	`submitted_at` text,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `essay_tasks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `writing_sessions_student_idx` ON `writing_sessions` (`student_id`);--> statement-breakpoint
CREATE INDEX `writing_sessions_class_idx` ON `writing_sessions` (`class_id`);--> statement-breakpoint
CREATE INDEX `writing_sessions_task_idx` ON `writing_sessions` (`task_id`);--> statement-breakpoint
CREATE INDEX `writing_sessions_class_status_idx` ON `writing_sessions` (`class_id`,`status`);--> statement-breakpoint
CREATE TABLE `weekly_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`week_start` text NOT NULL,
	`week_end` text NOT NULL,
	`essays_submitted` integer DEFAULT 0 NOT NULL,
	`average_score` real,
	`previous_average_score` real,
	`errors_resolved` text DEFAULT '[]',
	`new_errors` text DEFAULT '[]',
	`ability_changes` text DEFAULT '{}',
	`ai_suggestion` text,
	`recommended_exercises` text DEFAULT '[]',
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `weekly_reports_student_idx` ON `weekly_reports` (`student_id`);--> statement-breakpoint
CREATE INDEX `weekly_reports_week_idx` ON `weekly_reports` (`week_start`);--> statement-breakpoint
CREATE INDEX `weekly_reports_student_week_idx` ON `weekly_reports` (`student_id`,`week_start`);--> statement-breakpoint
CREATE TABLE `similarity_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`essay_id` text NOT NULL,
	`student_id` text NOT NULL,
	`overall_similarity` real,
	`matched_essay_ids` text DEFAULT '[]',
	`matched_details` text DEFAULT '[]',
	`ai_generated_score` real,
	`ai_detection_details` text DEFAULT '[]',
	`risk_level` text,
	`teacher_note` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`essay_id`) REFERENCES `essays`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `similarity_checks_essay_idx` ON `similarity_checks` (`essay_id`);--> statement-breakpoint
CREATE INDEX `similarity_checks_student_idx` ON `similarity_checks` (`student_id`);--> statement-breakpoint
CREATE INDEX `similarity_checks_risk_idx` ON `similarity_checks` (`risk_level`);--> statement-breakpoint
CREATE TABLE `resource_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `resource_comments_resource_idx` ON `resource_comments` (`resource_id`,`resource_type`);--> statement-breakpoint
CREATE INDEX `resource_comments_author_idx` ON `resource_comments` (`author_id`);--> statement-breakpoint
CREATE TABLE `resource_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`rater_id` text NOT NULL,
	`score` integer NOT NULL,
	`comment` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`rater_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `resource_ratings_resource_idx` ON `resource_ratings` (`resource_id`,`resource_type`);--> statement-breakpoint
CREATE INDEX `resource_ratings_rater_idx` ON `resource_ratings` (`rater_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `resource_ratings_unique_idx` ON `resource_ratings` (`resource_id`,`resource_type`,`rater_id`);--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`week_start` text NOT NULL,
	`week_end` text NOT NULL,
	`weak_points` text DEFAULT '[]',
	`recommendations` text DEFAULT '[]',
	`ai_advice` text,
	`completed_count` integer DEFAULT 0 NOT NULL,
	`total_recommendations` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `learning_paths_student_idx` ON `learning_paths` (`student_id`);--> statement-breakpoint
CREATE INDEX `learning_paths_week_idx` ON `learning_paths` (`week_start`);--> statement-breakpoint
CREATE INDEX `learning_paths_student_week_idx` ON `learning_paths` (`student_id`,`week_start`);--> statement-breakpoint
CREATE TABLE `exam_history` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`topic_type` text NOT NULL,
	`topic_category` text NOT NULL,
	`title` text NOT NULL,
	`requirements` text NOT NULL,
	`key_points` text DEFAULT '[]',
	`word_limit_min` integer DEFAULT 80 NOT NULL,
	`word_limit_max` integer DEFAULT 125 NOT NULL,
	`tags` text DEFAULT '[]',
	`model_essay` text,
	`trend_notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exam_history_year_idx` ON `exam_history` (`year`);--> statement-breakpoint
CREATE INDEX `exam_history_topic_type_idx` ON `exam_history` (`topic_type`);--> statement-breakpoint
CREATE INDEX `exam_history_topic_category_idx` ON `exam_history` (`topic_category`);--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`reference_id` text,
	`channel` text DEFAULT 'in_app' NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`sent_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_logs_user_idx` ON `notification_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_logs_type_idx` ON `notification_logs` (`type`);--> statement-breakpoint
CREATE INDEX `notification_logs_user_read_idx` ON `notification_logs` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `notification_logs_created_at_idx` ON `notification_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `challenge_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`student_id` text NOT NULL,
	`content` text NOT NULL,
	`word_count` integer NOT NULL,
	`score` real,
	`score_tier` text,
	`ai_feedback` text DEFAULT '{}',
	`duration_ms` integer,
	`streak_days` integer DEFAULT 1 NOT NULL,
	`submitted_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `daily_challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `challenge_submissions_challenge_idx` ON `challenge_submissions` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `challenge_submissions_student_idx` ON `challenge_submissions` (`student_id`);--> statement-breakpoint
CREATE INDEX `challenge_submissions_student_date_idx` ON `challenge_submissions` (`student_id`,`submitted_at`);--> statement-breakpoint
CREATE TABLE `daily_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_date` text NOT NULL,
	`stage` text DEFAULT 'junior' NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`instruction` text NOT NULL,
	`content` text NOT NULL,
	`reference_answer` text,
	`suggested_words` integer DEFAULT 50,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`topic_type` text,
	`topic_category` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `daily_challenges_date_idx` ON `daily_challenges` (`challenge_date`);--> statement-breakpoint
CREATE INDEX `daily_challenges_stage_idx` ON `daily_challenges` (`stage`);--> statement-breakpoint
CREATE INDEX `daily_challenges_date_stage_idx` ON `daily_challenges` (`challenge_date`,`stage`);--> statement-breakpoint
CREATE TABLE `student_material_favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`material_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`material_id`) REFERENCES `writing_materials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `student_material_favorites_student_idx` ON `student_material_favorites` (`student_id`);--> statement-breakpoint
CREATE INDEX `student_material_favorites_material_idx` ON `student_material_favorites` (`material_id`);--> statement-breakpoint
CREATE INDEX `student_material_favorites_unique_idx` ON `student_material_favorites` (`student_id`,`material_id`);--> statement-breakpoint
CREATE TABLE `writing_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`topic_type` text,
	`stage` text DEFAULT 'junior' NOT NULL,
	`difficulty` text DEFAULT 'medium' NOT NULL,
	`tags` text DEFAULT '[]',
	`source` text,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`school_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `writing_materials_type_idx` ON `writing_materials` (`type`);--> statement-breakpoint
CREATE INDEX `writing_materials_stage_idx` ON `writing_materials` (`stage`);--> statement-breakpoint
CREATE INDEX `writing_materials_topic_idx` ON `writing_materials` (`topic_type`);--> statement-breakpoint
CREATE INDEX `writing_materials_public_idx` ON `writing_materials` (`is_public`);--> statement-breakpoint
CREATE INDEX `writing_materials_creator_idx` ON `writing_materials` (`created_by`);--> statement-breakpoint
CREATE INDEX `writing_materials_school_idx` ON `writing_materials` (`school_id`);--> statement-breakpoint
CREATE TABLE `essay_peer_review_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`created_by` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`reviews_per_essay` integer DEFAULT 2 NOT NULL,
	`reviews_per_student` integer DEFAULT 2 NOT NULL,
	`anonymous` integer DEFAULT true NOT NULL,
	`weights` text DEFAULT '{"ai":0.6,"teacher":0.3,"peer":0.1}',
	`due_date` text,
	`guiding_questions` text DEFAULT '[]',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `essay_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `essay_peer_review_configs_task_idx` ON `essay_peer_review_configs` (`task_id`);--> statement-breakpoint
CREATE INDEX `essay_peer_review_configs_creator_idx` ON `essay_peer_review_configs` (`created_by`);--> statement-breakpoint
CREATE TABLE `peer_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`essay_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`content_score` integer,
	`language_score` integer,
	`structure_score` integer,
	`handwriting_score` integer,
	`total_score` integer,
	`comment` text,
	`answers` text DEFAULT '[]',
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`essay_id`) REFERENCES `essays`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `peer_reviews_essay_idx` ON `peer_reviews` (`essay_id`);--> statement-breakpoint
CREATE INDEX `peer_reviews_reviewer_idx` ON `peer_reviews` (`reviewer_id`);--> statement-breakpoint
CREATE INDEX `peer_reviews_status_idx` ON `peer_reviews` (`status`);--> statement-breakpoint
CREATE INDEX `peer_reviews_unique_idx` ON `peer_reviews` (`essay_id`,`reviewer_id`);--> statement-breakpoint
DROP INDEX `model_routes_stage_unique`;--> statement-breakpoint
ALTER TABLE `model_routes` ADD `route_stage` text;--> statement-breakpoint
ALTER TABLE `model_routes` ADD `senior_essay_type` text;--> statement-breakpoint
CREATE INDEX `model_routes_stage_unique_idx` ON `model_routes` (`stage`,`route_stage`,`senior_essay_type`);--> statement-breakpoint
ALTER TABLE `teaching_resources` ADD `analysis` text DEFAULT '{}';--> statement-breakpoint
ALTER TABLE `question_bank` ADD `created_by` text;