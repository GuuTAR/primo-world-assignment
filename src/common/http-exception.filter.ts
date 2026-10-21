import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

import type { Response as ExpressResponse } from 'express'

import { ResponseWithoutBody } from '@/common/response.model.js'

/** Renders every error as a `{ code, message }` body with the matching HTTP status. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<ExpressResponse>()

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
      } satisfies ResponseWithoutBody)
      return
    }

    const response = exception.getResponse()
    const message =
      typeof response === 'string'
        ? response
        : (response as { message?: string | string[] }).message
    const code = exception.getStatus()
    res.status(code).json({
      code,
      message: Array.isArray(message)
        ? message.join(', ')
        : (message ?? exception.message),
    } satisfies ResponseWithoutBody)
  }
}
