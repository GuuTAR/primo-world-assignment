import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import type { Response as ExpressResponse } from 'express'
import { STATUS_CODES } from 'node:http'
import { Observable, map } from 'rxjs'

import { RESPONSE_MESSAGE } from '@/common/response-message.decorator.js'
import { Response } from '@/common/response.model.js'

/**
 * Wraps handler results in the `{ code, message, body }` envelope. `message` comes
 * from `@ResponseMessage()`, falling back to the HTTP status text.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    const res = ctx.switchToHttp().getResponse<ExpressResponse>()
    const message = this.reflector.getAllAndOverride<string | undefined>(
      RESPONSE_MESSAGE,
      [ctx.getHandler(), ctx.getClass()],
    )
    return next.handle().pipe(
      map((body) => ({
        code: res.statusCode,
        message: message ?? STATUS_CODES[res.statusCode] ?? 'OK',
        body,
      })),
    )
  }
}
