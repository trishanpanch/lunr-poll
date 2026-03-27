CREATE TABLE `lmsConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(32) NOT NULL,
	`instanceUrl` varchar(512) NOT NULL,
	`apiToken` text NOT NULL,
	`label` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lmsConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lmsSyncLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`connectionId` int NOT NULL,
	`lmsCourseId` varchar(128),
	`lmsColumnId` varchar(128),
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`studentsSync` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lmsSyncLogs_id` PRIMARY KEY(`id`)
);
