import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'

import { AuthSignInResponse } from '@/auth/auth.model.js'

const INVALID_CREDENTIALS = new Set([
  'INVALID_LOGIN_CREDENTIALS',
  'EMAIL_NOT_FOUND',
  'INVALID_PASSWORD',
  'USER_DISABLED',
])
const BAD_REQUEST = new Set(['INVALID_EMAIL', 'MISSING_PASSWORD'])

interface SignInWithPasswordResult {
  idToken: string
  expiresIn: string
  localId: string
  email: string
}

@Injectable()
export class AuthService {
  /** Exchanges email + password for an ID token via the Identity Toolkit REST API. */
  async signIn(email: string, password: string): Promise<AuthSignInResponse> {
    const apiKey = process.env.FIREBASE_API_KEY
    if (!apiKey) {
      throw new InternalServerErrorException('FIREBASE_API_KEY is not set')
    }

    const res = await fetch(
      `${this.identityToolkitUrl()}/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    )
    const data = await res.json()

    if (!res.ok) {
      // Firebase error messages look like "CODE" or "CODE : details".
      const code = String(data?.error?.message ?? '').split(' ')[0]
      if (INVALID_CREDENTIALS.has(code)) {
        throw new UnauthorizedException('Invalid email or password')
      }
      if (BAD_REQUEST.has(code)) {
        throw new BadRequestException(code)
      }
      throw new InternalServerErrorException(`Firebase sign-in failed: ${code}`)
    }

    const result = data as SignInWithPasswordResult
    return {
      token: result.idToken,
      expires_in: Number(result.expiresIn),
      uid: result.localId,
      email: result.email,
    }
  }

  private identityToolkitUrl(): string {
    const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST
    return emulator
      ? `http://${emulator}/identitytoolkit.googleapis.com/v1`
      : 'https://identitytoolkit.googleapis.com/v1'
  }
}
