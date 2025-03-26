import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { CustomUserClaimsDto } from './dto/custom-user-claims.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('custom-claims')
  setCustomUserClaims(@Body() customUserClaimsDto: CustomUserClaimsDto) {
    return this.authService.setCustomUserClaims(customUserClaimsDto);
  }

  @Post('sign-out')
  signOut(@Body() userId: string) {
    return this.authService.signOut(userId);
  }

  @Post('refresh-auth')
  refreshAuth(@Query('refreshToken') refreshToken: string) {
    return this.authService.refreshAuthToken(refreshToken);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  login(@Body() loginDto: LoginDto) {
    return this.authService.loginUser(loginDto);
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }
}
