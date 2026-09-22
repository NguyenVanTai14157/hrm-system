-- CreateTable
CREATE TABLE `Application` (
    `id` CHAR(36) NOT NULL,
    `employeeId` CHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `status` ENUM('WAITING', 'APPROVING', 'APPROVED', 'NO_APPROVED', 'CANCELED') NOT NULL DEFAULT 'WAITING',
    `reason` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `payload` JSON NOT NULL,
    `currentStep` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Application_employeeId_createdAt_idx`(`employeeId`, `createdAt`),
    INDEX `Application_type_idx`(`type`),
    INDEX `Application_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationApproval` (
    `id` CHAR(36) NOT NULL,
    `applicationId` CHAR(36) NOT NULL,
    `step` INTEGER NOT NULL,
    `approverId` CHAR(36) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApplicationApproval_applicationId_step_idx`(`applicationId`, `step`),
    INDEX `ApplicationApproval_approverId_status_idx`(`approverId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationApproval` ADD CONSTRAINT `ApplicationApproval_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationApproval` ADD CONSTRAINT `ApplicationApproval_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
