ALTER TABLE `Shift`
  ADD COLUMN `overnight` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `checkInBefore` VARCHAR(10) NULL,
  ADD COLUMN `checkOutAfter` VARCHAR(10) NULL;

CREATE TABLE `ShiftGpsLocation` (
  `id` CHAR(36) NOT NULL,
  `shiftId` CHAR(36) NOT NULL,
  `gpsLocationId` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ShiftGpsLocation_shiftId_gpsLocationId_key` (`shiftId`, `gpsLocationId`),
  KEY `ShiftGpsLocation_gpsLocationId_idx` (`gpsLocationId`),
  CONSTRAINT `ShiftGpsLocation_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `Shift` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ShiftGpsLocation_gpsLocationId_fkey` FOREIGN KEY (`gpsLocationId`) REFERENCES `GpsLocation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
