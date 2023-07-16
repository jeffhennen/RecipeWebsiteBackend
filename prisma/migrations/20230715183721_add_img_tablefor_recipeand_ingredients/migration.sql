-- CreateTable
CREATE TABLE `Img` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recipeId` INTEGER NULL,
    `ingredientId` INTEGER NULL,
    `img` LONGBLOB NOT NULL,

    UNIQUE INDEX `Img_recipeId_key`(`recipeId`),
    UNIQUE INDEX `Img_ingredientId_key`(`ingredientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Img` ADD CONSTRAINT `Img_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Img` ADD CONSTRAINT `Img_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
