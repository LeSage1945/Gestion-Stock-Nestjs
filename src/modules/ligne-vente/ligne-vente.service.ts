import { Injectable } from '@nestjs/common';
import { CreateLigneVenteDto } from './dto/create-ligne-vente.dto';
import { UpdateLigneVenteDto } from './dto/update-ligne-vente.dto';

@Injectable()
export class LigneVenteService {
  create(createLigneVenteDto: CreateLigneVenteDto) {
    return 'This action adds a new ligneVente';
  }

  findAll() {
    return `This action returns all ligneVente`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ligneVente`;
  }

  update(id: number, updateLigneVenteDto: UpdateLigneVenteDto) {
    return `This action updates a #${id} ligneVente`;
  }

  remove(id: number) {
    return `This action removes a #${id} ligneVente`;
  }
}
