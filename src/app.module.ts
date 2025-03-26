import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [AppController],
  providers: [AppService, AuthGuard],
})
export class AppModule {}
