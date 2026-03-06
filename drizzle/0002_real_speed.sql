CREATE TABLE `generated_document` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`templateId` text(255) NOT NULL,
	`data` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`templateId`) REFERENCES `document_template`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `generated_document_template_id_idx` ON `generated_document` (`templateId`);