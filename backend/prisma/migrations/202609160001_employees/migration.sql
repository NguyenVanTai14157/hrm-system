-- AlterTable
ALTER TABLE `Employee` ADD COLUMN `address` VARCHAR(500) NULL,
    ADD COLUMN `birthday` DATE NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `departmentId` CHAR(36) NULL,
    ADD COLUMN `email` VARCHAR(254) NULL,
    ADD COLUMN `gender` ENUM('FEMALE', 'MALE', 'OTHER') NULL,
    ADD COLUMN `jobTitleId` CHAR(36) NULL,
    ADD COLUMN `joinDate` DATE NULL,
    ADD COLUMN `managerId` CHAR(36) NULL,
    ADD COLUMN `phone` VARCHAR(30) NULL,
    ADD COLUMN `positionId` CHAR(36) NULL,
    ADD COLUMN `status` ENUM('WAITING', 'WORKING', 'TEMPORARY', 'MATERNITY_LEAVE', 'UNPAID_LEAVE', 'MILITARY_LEAVE', 'STUDY_LEAVE', 'SICK_LEAVE', 'STOP_WORKING') NOT NULL DEFAULT 'WORKING',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `EmployeeCatalog` (
    `id` CHAR(36) NOT NULL,
    `kind` ENUM('DEPARTMENT', 'POSITION', 'JOB_TITLE') NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `EmployeeCatalog_kind_code_key`(`kind`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeHistory` (
    `id` CHAR(36) NOT NULL,
    `employeeId` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NULL,
    `actorName` VARCHAR(150) NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    `before` JSON NULL,
    `after` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmployeeHistory_employeeId_createdAt_idx`(`employeeId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Employee_status_createdAt_idx` ON `Employee`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Employee_departmentId_idx` ON `Employee`(`departmentId`);

-- CreateIndex
CREATE INDEX `Employee_positionId_idx` ON `Employee`(`positionId`);

-- CreateIndex
CREATE INDEX `Employee_jobTitleId_idx` ON `Employee`(`jobTitleId`);

-- CreateIndex
CREATE INDEX `Employee_managerId_idx` ON `Employee`(`managerId`);

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `EmployeeCatalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `EmployeeCatalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_jobTitleId_fkey` FOREIGN KEY (`jobTitleId`) REFERENCES `EmployeeCatalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeHistory` ADD CONSTRAINT `EmployeeHistory_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeHistory` ADD CONSTRAINT `EmployeeHistory_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Employee` ALTER COLUMN `updatedAt` DROP DEFAULT;
