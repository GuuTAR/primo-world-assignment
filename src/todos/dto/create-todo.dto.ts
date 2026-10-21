import { ApiProperty } from '@nestjs/swagger'

import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class TodoCreateRequest {
  @ApiProperty({ example: 'Buy milk' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string
}
