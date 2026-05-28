CREATE TABLE `attendance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`authorizationId` int NOT NULL,
	`sessionDate` date NOT NULL,
	`status_attendance` enum('presente','falta_justificada','falta_injustificada','cancelado_clinica','cancelado_paciente') NOT NULL,
	`justification` text,
	`evolutionId` int,
	`guardianSignature` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`tableName` varchar(100) NOT NULL,
	`recordId` int,
	`oldValues` json,
	`newValues` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `authorizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`guideNumber` varchar(50) NOT NULL,
	`authorizationDate` date NOT NULL,
	`expirationDate` date NOT NULL,
	`procedureCode` varchar(20) NOT NULL,
	`procedureName` varchar(255) NOT NULL,
	`authorizedQuantity` int NOT NULL,
	`usedQuantity` int NOT NULL DEFAULT 0,
	`specialty_auth` enum('psicologia_aba','fonoaudiologia','terapia_ocupacional','fisioterapia','psicopedagogia','musicoterapia','neuropsicologia') NOT NULL,
	`status_auth` enum('ativa','vencida','cancelada','esgotada') NOT NULL DEFAULT 'ativa',
	`observations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authorizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_evolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`authorizationId` int NOT NULL,
	`planId` int,
	`sessionDate` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`sessionDurationMinutes` int NOT NULL,
	`attendanceType` enum('individual_presencial','individual_domiciliar','individual_escolar','grupo_presencial') NOT NULL,
	`goalsWorked` json NOT NULL,
	`skillsWorked` json NOT NULL,
	`promptingLevel` enum('fisica_total','fisica_parcial','gestual','verbal','independente') NOT NULL,
	`behavioralNotes` text,
	`behavioralIntervention` text,
	`sessionSummary` text NOT NULL,
	`evolutionAssessment` enum('evolucao_significativa','evolucao_leve','estavel','retrocesso_leve','retrocesso_significativo') NOT NULL,
	`nextSessionPlan` text NOT NULL,
	`incidents` text,
	`professionalSignature` boolean NOT NULL DEFAULT false,
	`signedAt` timestamp,
	`guardianPresenceValidation` boolean NOT NULL DEFAULT false,
	`guardianValidationMethod` enum('assinatura_digital','token','presencial'),
	`locked` boolean NOT NULL DEFAULT false,
	`lockedAt` timestamp,
	`addendum` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_evolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_evolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`referenceMonth` int NOT NULL,
	`referenceYear` int NOT NULL,
	`totalSessions` int NOT NULL,
	`totalPresent` int NOT NULL,
	`totalAbsent` int NOT NULL,
	`goalsProgress` json NOT NULL,
	`generatedSummary` text NOT NULL,
	`professionalReview` text,
	`approved` boolean NOT NULL DEFAULT false,
	`approvedAt` timestamp,
	`conclusion` text,
	`nextMonthPlan` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_evolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cpf` varchar(14),
	`birthDate` date NOT NULL,
	`gender` enum('masculino','feminino','outro') NOT NULL,
	`guardianName` varchar(255) NOT NULL,
	`guardianCpf` varchar(14) NOT NULL,
	`guardianPhone` varchar(20) NOT NULL,
	`guardianEmail` varchar(320),
	`healthPlanName` varchar(255) NOT NULL,
	`healthPlanCard` varchar(50) NOT NULL,
	`cid10Primary` varchar(10) NOT NULL,
	`cid10Secondary` varchar(10),
	`diagnosis` text NOT NULL,
	`address` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`specialty` enum('psicologia_aba','fonoaudiologia','terapia_ocupacional','fisioterapia','psicopedagogia','musicoterapia','neuropsicologia') NOT NULL,
	`councilType` varchar(20) NOT NULL,
	`councilNumber` varchar(30) NOT NULL,
	`councilState` varchar(2) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professionals_id` PRIMARY KEY(`id`),
	CONSTRAINT `professionals_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `therapeutic_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`targetCriteria` text NOT NULL,
	`currentProgress` decimal(5,2) NOT NULL DEFAULT '0',
	`status_goal` enum('em_andamento','adquirida','em_manutencao','descontinuada') NOT NULL DEFAULT 'em_andamento',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `therapeutic_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `therapeutic_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`frequency` varchar(100) NOT NULL,
	`sessionDuration` int NOT NULL,
	`generalObjective` text NOT NULL,
	`status_pts` enum('ativo','revisao','encerrado') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `therapeutic_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_professionalId_professionals_id_fk` FOREIGN KEY (`professionalId`) REFERENCES `professionals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_authorizationId_authorizations_id_fk` FOREIGN KEY (`authorizationId`) REFERENCES `authorizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_evolutionId_daily_evolutions_id_fk` FOREIGN KEY (`evolutionId`) REFERENCES `daily_evolutions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authorizations` ADD CONSTRAINT `authorizations_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_evolutions` ADD CONSTRAINT `daily_evolutions_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_evolutions` ADD CONSTRAINT `daily_evolutions_professionalId_professionals_id_fk` FOREIGN KEY (`professionalId`) REFERENCES `professionals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_evolutions` ADD CONSTRAINT `daily_evolutions_authorizationId_authorizations_id_fk` FOREIGN KEY (`authorizationId`) REFERENCES `authorizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_evolutions` ADD CONSTRAINT `daily_evolutions_planId_therapeutic_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `therapeutic_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monthly_evolutions` ADD CONSTRAINT `monthly_evolutions_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monthly_evolutions` ADD CONSTRAINT `monthly_evolutions_professionalId_professionals_id_fk` FOREIGN KEY (`professionalId`) REFERENCES `professionals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `professionals` ADD CONSTRAINT `professionals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `therapeutic_goals` ADD CONSTRAINT `therapeutic_goals_planId_therapeutic_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `therapeutic_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `therapeutic_plans` ADD CONSTRAINT `therapeutic_plans_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `therapeutic_plans` ADD CONSTRAINT `therapeutic_plans_professionalId_professionals_id_fk` FOREIGN KEY (`professionalId`) REFERENCES `professionals`(`id`) ON DELETE no action ON UPDATE no action;