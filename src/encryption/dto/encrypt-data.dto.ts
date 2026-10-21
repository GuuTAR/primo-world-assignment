import { ApiProperty } from '@nestjs/swagger'

import { IsString, MaxLength } from 'class-validator'

export class EncryptDataRequest {
  @ApiProperty({ example: 'Hello, world!', minLength: 0, maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  payload: string
}
