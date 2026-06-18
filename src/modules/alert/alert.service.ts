import {
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';


@Injectable()
export class AlertService {

  constructor(
    private prismaService: PrismaService
  ) { }

  // ✅ CREER UNE ALERTE
  async create(createDto: CreateAlertDto) {
    const { produitId, niveauAlerte } = createDto;

    try {
      // vérifier produit
      const produit = await this.prismaService.produit.findUnique({
        where: { id: produitId }
      });

      if (!produit) {
        throw new NotFoundException('Produit introuvable');
      }

      // 🔥 calcul stock actuel
      const stock = await this.getStockActuel(produitId);

      // créer alerte
      const alerte = await this.prismaService.alerteStock.create({
        data: {
          produitId,
          niveauAlerte,
          quantiteActuelle: stock
        }
      });

      return alerte;

    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Erreur création alerte');
    }
  }

  // ✅ GET ALL ALERTES
  // ✅ GET ALL ALERTES
  async findAll() {
    try {
      const alert = await this.prismaService.alerteStock.findMany({
        include: {
          produit: true
        },
        orderBy: { creeLe: 'desc' }
      });

      console.log(alert);

      return alert;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // ✅ GET ONE
  async findOne(id: string) {
    const alerte = await this.prismaService.alerteStock.findUnique({
      where: { id },
      include: { produit: true }
    });

    if (!alerte) {
      throw new NotFoundException('Alerte introuvable');
    }

    return alerte;
  }

  // ✅ UPDATE
  async update(id: string, updateDto: UpdateAlertDto) {
    try {
      const existing = await this.prismaService.alerteStock.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new NotFoundException('Alerte introuvable');
      }

      return await this.prismaService.alerteStock.update({
        where: { id },
        data: updateDto
      });

    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Erreur update alerte');
    }
  }

  // ✅ DELETE
  async remove(id: string) {
    try {
      await this.prismaService.alerteStock.delete({
        where: { id }
      });

      return { message: 'Alerte supprimée avec succès' };

    } catch (error) {
      throw new InternalServerErrorException('Erreur suppression');
    }
  }

  // 🔥 CALCUL STOCK ACTUEL (réutilisable)
  async getStockActuel(produitId: string): Promise<number> {

    const entrees = await this.prismaService.entreeStock.aggregate({
      where: { produitId },
      _sum: { quantite: true }
    });

    const sorties = await this.prismaService.sortieStock.aggregate({
      where: { produitId },
      _sum: { quantite: true }
    });

    const ventes = await this.prismaService.ligneVente.aggregate({
      where: { produitId },
      _sum: { quantite: true }
    });

    return (entrees._sum.quantite || 0)
      - (sorties._sum.quantite || 0)
      - (ventes._sum.quantite || 0);
  }

  // 🚨 VERIFIER SI ALERTE DOIT ÊTRE DECLENCHEE
  async verifierAlertes() {
    const alertes = await this.prismaService.alerteStock.findMany();

    const result: any[] = [];

    for (const alerte of alertes) {

      const stock = await this.getStockActuel(alerte.produitId);

      if (stock <= alerte.niveauAlerte) {
        result.push({
          produitId: alerte.produitId,
          stockActuel: stock,
          niveauAlerte: alerte.niveauAlerte,
          statut: 'CRITIQUE'
        });
      }
    }

    return result;
  }
}