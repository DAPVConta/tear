ALTER TABLE `attendance_records` MODIFY COLUMN `authorizationId` int;--> statement-breakpoint
ALTER TABLE `authorizations` MODIFY COLUMN `specialty_auth` enum('psicologia_aba','fonoaudiologia','terapia_ocupacional_is','terapia_ocupacional_avds','fisioterapia','psicopedagogia','musicoterapia','neuropsicologia') NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_evolutions` MODIFY COLUMN `authorizationId` int;--> statement-breakpoint
ALTER TABLE `patients` MODIFY COLUMN `healthPlanName` varchar(255);--> statement-breakpoint
ALTER TABLE `patients` MODIFY COLUMN `healthPlanCard` varchar(50);--> statement-breakpoint
ALTER TABLE `professionals` MODIFY COLUMN `specialty` enum('psicologia_aba','fonoaudiologia','terapia_ocupacional_is','terapia_ocupacional_avds','fisioterapia','psicopedagogia','musicoterapia','neuropsicologia') NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `isPrivateAttendance` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_evolutions` ADD `isPrivate` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `patients` ADD `paymentType` enum('operadora','particular') DEFAULT 'operadora' NOT NULL;