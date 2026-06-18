/*
  Warnings:

  - A unique constraint covering the columns `[produitId]` on the table `AlerteStock` will be added. If there are existing duplicate values, this will fail.

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

-- CreateIndex
CREATE UNIQUE INDEX `AlerteStock_produitId_key` ON `AlerteStock`(`produitId`);

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
