import { ApiProperty } from '@nestjs/swagger'

export class Todo {
  @ApiProperty({ example: '665f1c2e8b3e4a0012345678' })
  id: string

  @ApiProperty({ example: 'Buy milk' })
  title: string

  @ApiProperty({ example: false })
  is_completed: boolean

  @ApiProperty()
  created_at: Date

  @ApiProperty()
  updated_at: Date
}
