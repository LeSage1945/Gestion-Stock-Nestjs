-- DropIndex
DROP INDEX `EntreeStock_fournisseurId_fkey` ON `entreestock`;

-- DropIndex
DROP INDEX `EntreeStock_produitId_fkey` ON `entreestock`;

-- DropIndex
DROP INDEX `Fournisseur_compteId_fkey` ON `fournisseur`;

-- DropIndex
DROP INDEX `JournalActivite_utilisateurId_fkey` ON `journalactivite`;

-- DropIndex
DROP INDEX `LigneVente_produitId_fkey` ON `lignevente`;

-- DropIndex
DROP INDEX `LigneVente_venteId_fkey` ON `lignevente`;

-- DropIndex
DROP INDEX `Paiement_venteId_fkey` ON `paiement`;

-- DropIndex
DROP INDEX `Produit_compteId_fkey` ON `produit`;

-- DropIndex
DROP INDEX `SortieStock_produitId_fkey` ON `sortiestock`;

-- DropIndex
DROP INDEX `Utilisateur_compteId_fkey` ON `utilisateur`;

-- DropIndex
DROP INDEX `Vente_compteId_fkey` ON `vente`;

-- DropIndex
DROP INDEX `Vente_utilisateurId_fkey` ON `vente`;

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
ALTER TABLE `Vente` ADD CONSTRAINT `Vente_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `Compte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vente` ADD CONSTRAINT `Vente_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneVente` ADD CONSTRAINT `LigneVente_venteId_fkey` FOREIGN KEY (`venteId`) REFERENCES `Vente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneVente` ADD CONSTRAINT `LigneVente_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paiement` ADD CONSTRAINT `Paiement_venteId_fkey` FOREIGN KEY (`venteId`) REFERENCES `Vente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SortieStock` ADD CONSTRAINT `SortieStock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlerteStock` ADD CONSTRAINT `AlerteStock_produitId_fkey` FOREIGN KEY (`produitId`) REFERENCES `Produit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalActivite` ADD CONSTRAINT `JournalActivite_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Abonnement` ADD CONSTRAINT `Abonnement_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `Compte`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
