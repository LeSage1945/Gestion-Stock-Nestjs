/*
  Warnings:

  - The primary key for the `alertestock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `entreestock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `fournisseur` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `journalactivite` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `lignevente` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `paiement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `produit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sortiestock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `utilisateur` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `vente` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX `AlerteStock_produitId_fkey` ON `alertestock`;

-- DropIndex
DROP INDEX `EntreeStock_fournisseurId_fkey` ON `entreestock`;

-- DropIndex
DROP INDEX `EntreeStock_produitId_fkey` ON `entreestock`;

-- DropIndex
DROP INDEX `JournalActivite_utilisateurId_fkey` ON `journalactivite`;

-- DropIndex
DROP INDEX `LigneVente_produitId_fkey` ON `lignevente`;

-- DropIndex
DROP INDEX `LigneVente_venteId_fkey` ON `lignevente`;

-- DropIndex
DROP INDEX `Paiement_venteId_fkey` ON `paiement`;

-- DropIndex
DROP INDEX `SortieStock_produitId_fkey` ON `sortiestock`;

-- DropIndex
DROP INDEX `Vente_utilisateurId_fkey` ON `vente`;

-- AlterTable
ALTER TABLE `alertestock` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `produitId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `entreestock` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `produitId` VARCHAR(191) NOT NULL,
    MODIFY `fournisseurId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `fournisseur` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `journalactivite` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `utilisateurId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `lignevente` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `venteId` VARCHAR(191) NOT NULL,
    MODIFY `produitId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `paiement` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `venteId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `produit` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `sortiestock` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `produitId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `utilisateur` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `vente` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `utilisateurId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `EntreeStock` ADD CONSTRAINT `EntreeStock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntreeStock` ADD CONSTRAINT `EntreeStock_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SortieStock` ADD CONSTRAINT `SortieStock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vente` ADD CONSTRAINT `Vente_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneVente` ADD CONSTRAINT `LigneVente_venteId_fkey` FOREIGN KEY (`venteId`) REFERENCES `Vente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneVente` ADD CONSTRAINT `LigneVente_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paiement` ADD CONSTRAINT `Paiement_venteId_fkey` FOREIGN KEY (`venteId`) REFERENCES `Vente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlerteStock` ADD CONSTRAINT `AlerteStock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalActivite` ADD CONSTRAINT `JournalActivite_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
