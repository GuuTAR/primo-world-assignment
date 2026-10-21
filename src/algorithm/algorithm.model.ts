import { ApiProperty } from '@nestjs/swagger'

export class MergeResponse {
  @ApiProperty({
    type: [Number],
    example: [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
    description: 'All elements of the three collections in ascending order',
  })
  result: number[]
}
