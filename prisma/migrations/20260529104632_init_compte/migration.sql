/*
  Warnings:

  - Added the required column `compteId` to the `Fournisseur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `compteId` to the `Produit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `compteId` to the `Utilisateur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `compteId` to the `Vente` table without a default value. This is not possible if the table is not empty.

*/
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
DROP INDEX `Utilisateur_email_key` ON `utilisateur`;

-- DropIndex
DROP INDEX `Vente_utilisateurId_fkey` ON `vente`;

-- AlterTable
ALTER TABLE `fournisseur` ADD COLUMN `compteId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `produit` ADD COLUMN `compteId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `utilisateur` ADD COLUMN `compteId` VARCHAR(191) NOT NULL,
    MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'VENDEUR', 'CAISSIER') NOT NULL DEFAULT 'VENDEUR';

-- AlterTable
ALTER TABLE `vente` ADD COLUMN `compteId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Compte` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Compte_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Abonnement` (
    `id` VARCHAR(191) NOT NULL,
    `compteId` VARCHAR(191) NOT NULL,
    `statut` ENUM('ACTIF', 'INACTIF', 'EXPIRE', 'BLOQUE') NOT NULL DEFAULT 'INACTIF',
    `debut` DATETIME(3) NULL,
    `fin` DATETIME(3) NULL,
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Abonnement_compteId_key`(`compteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Utilisateur` ADD CONSTRAINT `Utilisateur_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `Compte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Produit` ADD CONSTRAINT `Produit_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `Compte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fournisseur` ADD CONSTRAINT `Fournisseur_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `Compte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntreeStock` ADD CONSTRAINT `EntreeStock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntreeStock` ADD CONSTRAINT `EntreeStock_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SortieStock` ADD CONSTRAINT `SortieStock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vente` ADD CONSTRAINT `Vente_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `Compte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `Abonnement` ADD CONSTRAINT `Abonnement_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `Compte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
