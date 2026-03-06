ALTER TABLE `document_template` ADD `createdById` text(255) REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `generated_document` ADD `createdById` text(255) REFERENCES user(id);