import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';
import { ClientService } from './clients.service';

@UseGuards(AuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientService) { }

  @Post()
  create(@Body() dto: CreateClientDto, @Req() req: any) {
    return this.clientsService.create(dto, req.user.compteId);
  }

  @Get()
  findAll(@Query('recherche') recherche: string, @Req() req: any) {
    return this.clientsService.findAll(req.user.compteId, recherche);
  }

  @Get('recherche-telephone')
  findByTelephone(@Query('telephone') telephone: string, @Req() req: any) {
    return this.clientsService.findByTelephone(telephone, req.user.compteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, req.user.compteId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: any,
  ) {
    return this.clientsService.update(id, dto, req.user.compteId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.remove(id, req.user.compteId);
  }
}