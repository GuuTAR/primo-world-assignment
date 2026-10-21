import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

import type { Response as ExpressResponse } from 'express'

import {
  EncryptionErrorCode,
  EncryptionErrorResponse,
} from './encryption.model.js'

export class DecryptionFailedException extends BadRequestException {}

/** Renders every error as `{ successful: false, error_code, data: null }`. */
@Catch()
export class EncryptionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EncryptionExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<ExpressResponse>()

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR
    let errorCode = EncryptionErrorCode.InternalError
    if (exception instanceof DecryptionFailedException) {
      status = exception.getStatus()
      errorCode = EncryptionErrorCode.DecryptionFailed
    } else if (
      exception instanceof HttpException &&
      exception.getStatus() < 500
    ) {
      status = exception.getStatus()
      errorCode = EncryptionErrorCode.InvalidRequest
    } else {
      this.logger.error(exception)
    }

    res.status(status).json({
      successful: false,
      error_code: errorCode,
      data: null,
    } satisfies EncryptionErrorResponse)
  }
}
