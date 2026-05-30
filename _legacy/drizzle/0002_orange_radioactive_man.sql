CREATE TABLE `clinic_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`userId` int NOT NULL,
	`member_role` enum('clinic_admin','therapist','receptionist') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cnpj` varchar(18) NOT NULL,
	`tradeName` varchar(255),
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`plan` enum('trial','basic','professional','enterprise') NOT NULL DEFAULT 'trial',
	`planStatus` enum('active','past_due','canceled','trialing') NOT NULL DEFAULT 'trialing',
	`trialEndsAt` timestamp,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`maxProfessionals` int NOT NULL DEFAULT 5,
	`maxPatients` int NOT NULL DEFAULT 50,
	`logoUrl` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinics_id` PRIMARY KEY(`id`),
	CONSTRAINT `clinics_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
ALTER TABLE `professionals` DROP INDEX `professionals_cpf_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','platform_admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `clinicId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `clinicId` int;--> statement-breakpoint
ALTER TABLE `authorizations` ADD `clinicId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_evolutions` ADD `clinicId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `monthly_evolutions` ADD `clinicId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `patients` ADD `clinicId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `professionals` ADD `clinicId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `therapeutic_plans` ADD `clinicId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `clinic_members` ADD CONSTRAINT `clinic_members_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clinic_members` ADD CONSTRAINT `clinic_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authorizations` ADD CONSTRAINT `authorizations_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_evolutions` ADD CONSTRAINT `daily_evolutions_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monthly_evolutions` ADD CONSTRAINT `monthly_evolutions_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `professionals` ADD CONSTRAINT `professionals_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `therapeutic_plans` ADD CONSTRAINT `therapeutic_plans_clinicId_clinics_id_fk` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE no action ON UPDATE no action;