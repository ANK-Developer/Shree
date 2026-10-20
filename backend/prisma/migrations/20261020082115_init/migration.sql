-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` CHAR(36) NOT NULL,
    `photoUrl` VARCHAR(255) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL,
    `fatherHusbandName` VARCHAR(191) NOT NULL,
    `surname` VARCHAR(191) NOT NULL DEFAULT '',
    `memberType` VARCHAR(191) NOT NULL,
    `bloodGroup` VARCHAR(5) NOT NULL DEFAULT '',
    `aadharNumber` VARCHAR(12) NOT NULL DEFAULT '',
    `occupation` VARCHAR(191) NOT NULL DEFAULT '',
    `address` TEXT NOT NULL DEFAULT '',
    `pincode` VARCHAR(6) NOT NULL DEFAULT '',
    `mobileNumber` VARCHAR(10) NOT NULL,
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `birthDate` DATE NOT NULL,
    `anniversaryDate` DATE NULL,
    `memberStatus` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_mobileNumber_key`(`mobileNumber`),
    INDEX `members_memberStatus_idx`(`memberStatus`),
    INDEX `members_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_members` (
    `id` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `relation` VARCHAR(191) NOT NULL DEFAULT '',
    `dob` DATE NULL,
    `mobile` VARCHAR(10) NOT NULL DEFAULT '',

    INDEX `family_members_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nominees` (
    `id` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(191) NOT NULL,
    `relation` VARCHAR(191) NOT NULL DEFAULT '',
    `mobile` VARCHAR(10) NOT NULL,

    INDEX `nominees_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `id` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `mobile` VARCHAR(10) NOT NULL DEFAULT '',

    INDEX `referrals_memberId_idx`(`memberId`),
    INDEX `referrals_mobile_idx`(`mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` CHAR(36) NOT NULL,
    `eventBanner` VARCHAR(255) NULL,
    `eventName` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `venue` VARCHAR(300) NOT NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `endDateTime` DATETIME(3) NOT NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `events_startDateTime_idx`(`startDateTime`),
    INDEX `events_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_participants` (
    `id` CHAR(36) NOT NULL,
    `eventId` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `participationStatus` ENUM('ACCEPTED', 'REJECTED', 'NOT_CONFIRMED') NOT NULL DEFAULT 'NOT_CONFIRMED',
    `callCount` INTEGER NOT NULL DEFAULT 0,
    `lastCalledAt` DATETIME(3) NULL,
    `lastCallStatus` ENUM('PENDING', 'ANSWERED', 'NOT_ANSWERED', 'BUSY', 'FAILED') NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `event_participants_eventId_participationStatus_idx`(`eventId`, `participationStatus`),
    INDEX `event_participants_memberId_idx`(`memberId`),
    UNIQUE INDEX `event_participants_eventId_memberId_key`(`eventId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_calls` (
    `id` CHAR(36) NOT NULL,
    `eventParticipantId` CHAR(36) NOT NULL,
    `callStatus` ENUM('PENDING', 'ANSWERED', 'NOT_ANSWERED', 'BUSY', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `callResponse` VARCHAR(1000) NULL,
    `calledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `calledBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `event_calls_eventParticipantId_calledAt_idx`(`eventParticipantId`, `calledAt` DESC),
    INDEX `event_calls_calledBy_idx`(`calledBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nominees` ADD CONSTRAINT `nominees_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_participants` ADD CONSTRAINT `event_participants_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_participants` ADD CONSTRAINT `event_participants_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_calls` ADD CONSTRAINT `event_calls_eventParticipantId_fkey` FOREIGN KEY (`eventParticipantId`) REFERENCES `event_participants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_calls` ADD CONSTRAINT `event_calls_calledBy_fkey` FOREIGN KEY (`calledBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
