import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('connexion')
  create(@Body() createAuthDto: LoginDto) {
    console.log(createAuthDto)
    return this.authService.signIn(createAuthDto);
  }

}
