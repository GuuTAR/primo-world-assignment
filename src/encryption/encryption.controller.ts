import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { DecryptDataRequest } from './dto/decrypt-data.dto.js'
import { EncryptDataRequest } from './dto/encrypt-data.dto.js'
import { EncryptionExceptionFilter } from './encryption-exception.filter.js'
import {
  DecryptDataResponse,
  EncryptDataResponse,
  EncryptionErrorResponse,
} from './encryption.model.js'
import { EncryptionService } from './encryption.service.js'

@ApiTags('encryption')
@Controller()
@UseFilters(EncryptionExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true }))
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Post('get-encrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Encrypt a payload',
    description:
      'Encrypts the payload with a random AES key (data2) and encrypts that key with the RSA private key (data1).',
  })
  @ApiOkResponse({ type: EncryptDataResponse })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (INVALID_REQUEST)',
    type: EncryptionErrorResponse,
  })
  encrypt(@Body() body: EncryptDataRequest): EncryptDataResponse {
    return {
      successful: true,
      error_code: '',
      data: this.encryptionService.encrypt(body.payload),
    }
  }

  @Post('get-decrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decrypt a payload',
    description:
      'Decrypts the AES key (data1) with the RSA public key, then decrypts the payload (data2) with it.',
  })
  @ApiOkResponse({ type: DecryptDataResponse })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request (INVALID_REQUEST) or undecryptable data (DECRYPTION_FAILED)',
    type: EncryptionErrorResponse,
  })
  decrypt(@Body() body: DecryptDataRequest): DecryptDataResponse {
    return {
      successful: true,
      error_code: '',
      data: this.encryptionService.decrypt(body.data1, body.data2),
    }
  }
}
