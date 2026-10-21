import { ApiProperty } from '@nestjs/swagger'

import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class AuthSignInRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string
}
