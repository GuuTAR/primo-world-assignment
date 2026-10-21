import { ApiProperty } from '@nestjs/swagger'

import { IsNotEmpty, IsString } from 'class-validator'

export class DecryptDataRequest {
  @ApiProperty({ description: 'AES key encrypted with the RSA private key' })
  @IsString()
  @IsNotEmpty()
  data1: string

  @ApiProperty({ description: 'Payload encrypted with the AES key' })
  @IsString()
  @IsNotEmpty()
  data2: string
}
