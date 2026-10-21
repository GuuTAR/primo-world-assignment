import { ApiProperty } from '@nestjs/swagger'

import {
  buildMessage,
  IsArray,
  IsInt,
  ValidateBy,
  ValidationOptions,
} from 'class-validator'

/** Checks order by comparing neighbours, so no sort function is needed. */
const IsSorted = (
  order: 'ascending' | 'descending',
  options?: ValidationOptions,
) =>
  ValidateBy(
    {
      name: order === 'ascending' ? 'isSortedAscending' : 'isSortedDescending',
      validator: {
        validate: (value: unknown) =>
          Array.isArray(value) &&
          value.every(
            (v, i) =>
              i === 0 ||
              (order === 'ascending' ? value[i - 1] <= v : value[i - 1] >= v),
          ),
        defaultMessage: buildMessage(
          () => `$property must be sorted in ${order} order`,
          options,
        ),
      },
    },
    options,
  )

export class MergeRequest {
  @ApiProperty({
    type: [Number],
    example: [10, 7, 4, 1],
    description: 'Integers sorted from max to min',
  })
  @IsArray()
  @IsInt({ each: true })
  @IsSorted('descending')
  collection_1: number[]

  @ApiProperty({
    type: [Number],
    example: [0, 2, 5, 8],
    description: 'Integers sorted from min to max',
  })
  @IsArray()
  @IsInt({ each: true })
  @IsSorted('ascending')
  collection_2: number[]

  @ApiProperty({
    type: [Number],
    example: [0, 3, 6, 9, 12],
    description: 'Integers sorted from min to max',
  })
  @IsArray()
  @IsInt({ each: true })
  @IsSorted('ascending')
  collection_3: number[]
}
