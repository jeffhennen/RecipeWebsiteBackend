-- DropForeignKey
ALTER TABLE `Recipe` DROP FOREIGN KEY `Recipe_userID_fkey`;

-- AlterTable
ALTER TABLE `Recipe` MODIFY `userID` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Recipe` ADD CONSTRAINT `Recipe_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
