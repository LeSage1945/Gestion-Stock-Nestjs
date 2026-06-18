import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post('create')
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertService.create(createAlertDto);
  }

  @Get('get/all')
  findAll() {
    return this.alertService.findAll();
  }

  @Get('get/one/:id')
  findOne(@Param('id') id: string) {
    return this.alertService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertService.update(id, updateAlertDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.alertService.remove(id);
  }
}
