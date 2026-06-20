-- DropForeignKey
ALTER TABLE `EntreeStock` DROP FOREIGN KEY `EntreeStock_fournisseurId_fkey`;

-- AlterTable
ALTER TABLE `EntreeStock` MODIFY `fournisseurId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `EntreeStock` ADD CONSTRAINT `EntreeStock_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

