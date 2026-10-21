import { ApiProperty } from '@nestjs/swagger'

import type { DecodedIdToken } from 'firebase-admin/auth'

export class AuthSignInResponse {
  @ApiProperty({ description: 'Firebase ID token, use as Bearer token' })
  token: string

  @ApiProperty({ description: 'Seconds until token expires', example: 3600 })
  expires_in: number

  @ApiProperty({ description: 'Firebase UID' })
  uid: string

  @ApiProperty({ example: 'user@example.com' })
  email: string
}

export class AuthMeResponse {
  @ApiProperty({ description: 'Firebase UID' })
  uid: string

  @ApiProperty({
    description: 'Decoded ID token claims, including custom claims',
    type: 'object',
    additionalProperties: true,
  })
  claims: DecodedIdToken
}
