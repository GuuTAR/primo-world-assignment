import { ApiProperty } from '@nestjs/swagger'

export enum EncryptionErrorCode {
  InvalidRequest = 'INVALID_REQUEST',
  DecryptionFailed = 'DECRYPTION_FAILED',
  InternalError = 'INTERNAL_ERROR',
}

export class EncryptedData {
  @ApiProperty({ description: 'AES key encrypted with the RSA private key' })
  data1: string

  @ApiProperty({ description: 'Payload encrypted with the AES key' })
  data2: string
}

export class DecryptedData {
  @ApiProperty({ example: 'Hello, world!' })
  payload: string
}

export class EncryptDataResponse {
  @ApiProperty({ example: true })
  successful: boolean

  @ApiProperty({ example: '' })
  error_code: string

  @ApiProperty({ type: EncryptedData, nullable: true })
  data: EncryptedData | null
}

export class DecryptDataResponse {
  @ApiProperty({ example: true })
  successful: boolean

  @ApiProperty({ example: '' })
  error_code: string

  @ApiProperty({ type: DecryptedData, nullable: true })
  data: DecryptedData | null
}

export class EncryptionErrorResponse {
  @ApiProperty({ example: false })
  successful: boolean

  @ApiProperty({ enum: EncryptionErrorCode })
  error_code: EncryptionErrorCode

  @ApiProperty({ type: 'null', nullable: true, example: null })
  data: null
}
