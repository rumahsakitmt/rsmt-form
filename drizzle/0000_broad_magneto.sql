CREATE TABLE `document_template` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`title` text(256) NOT NULL,
	`category` text(100) NOT NULL,
	`status` text(50) NOT NULL,
	`theme` text(50) DEFAULT 'light' NOT NULL,
	`icon` text(50),
	`fileName` text(255) NOT NULL,
	`filePath` text(1024) NOT NULL,
	`fileHash` text(255),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `template_field` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`templateId` text(255) NOT NULL,
	`name` text(255) NOT NULL,
	`label` text(255) NOT NULL,
	`fieldType` text(50) DEFAULT 'text' NOT NULL,
	`isRequired` integer DEFAULT true,
	`order` integer DEFAULT 0,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`templateId`) REFERENCES `document_template`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `template_field_template_id_idx` ON `template_field` (`templateId`);