import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import type { Request } from 'express'
import { Auth, DecodedIdToken } from 'firebase-admin/auth'

import { FIREBASE_AUTH } from '@/firebase/firebase.module.js'

export type AuthenticatedRequest = Request & { user: DecodedIdToken }

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject(FIREBASE_AUTH) private readonly auth: Auth) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    const [scheme, token] = req.headers.authorization?.split(' ') ?? []
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token')
    }

    try {
      req.user = await this.auth.verifyIdToken(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
    return true
  }
}
