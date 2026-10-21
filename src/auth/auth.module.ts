import { Module } from '@nestjs/common'

import { AuthController } from '@/auth/auth.controller.js'
import { AuthService } from '@/auth/auth.service.js'
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard.js'

@Module({
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard],
  exports: [FirebaseAuthGuard],
})
export class AuthModule {}
