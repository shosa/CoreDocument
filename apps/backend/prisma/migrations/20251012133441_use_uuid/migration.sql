/*
  Warnings:

  - The primary key for the `documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `favorites` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_documentId_fkey`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_userId_fkey`;

-- AlterTable
ALTER TABLE `documents` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `favorites` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `documentId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
