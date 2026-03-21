CREATE TABLE `responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`questionId` varchar(16) NOT NULL,
	`studentId` varchar(64) NOT NULL,
	`studentName` varchar(128),
	`answer` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL DEFAULT 'Untitled Session',
	`code` varchar(6) NOT NULL,
	`status` enum('draft','live','closed') NOT NULL DEFAULT 'draft',
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`questions` json NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`launchedAt` timestamp,
	`closedAt` timestamp,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_code_unique` UNIQUE(`code`)
);
