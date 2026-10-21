import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { DecodedIdToken } from 'firebase-admin/auth'

import {
  ApiErrorResponses,
  ApiOkResponseOf,
} from '@/common/api-response.decorator.js'
import { HttpExceptionFilter } from '@/common/http-exception.filter.js'
import { ResponseMessage } from '@/common/response-message.decorator.js'
import { ResponseInterceptor } from '@/common/response.interceptor.js'

import { AuthMeResponse, AuthSignInResponse } from '@/auth/auth.model.js'
import { AuthService } from '@/auth/auth.service.js'
import { CurrentUser } from '@/auth/current-user.decorator.js'
import { AuthSignInRequest } from '@/auth/dto/sign-in.dto.js'
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard.js'

@ApiTags('auth')
@Controller('api/v1/auth')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in and get a Bearer token',
    description:
      'Exchanges email + password for a Firebase ID token.\nUse the returned value as: Authorization: Bearer <token>',
  })
  @ResponseMessage('Success')
  @ApiOkResponseOf(AuthSignInResponse)
  @ApiErrorResponses(
    { status: 400, description: 'Bad Request' },
    { status: 401, description: 'Unauthorized' },
    { status: 500, description: 'Internal Server Error' },
  )
  @UsePipes(new ValidationPipe({ whitelist: true }))
  signIn(@Body() body: AuthSignInRequest): Promise<AuthSignInResponse> {
    return this.authService.signIn(body.email, body.password)
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the Firebase UID and claims of the authenticated caller.',
  })
  @ResponseMessage('User retrieved successfully')
  @ApiOkResponseOf(AuthMeResponse)
  @ApiErrorResponses({ status: 401, description: 'Unauthorized' })
  me(@CurrentUser() user: DecodedIdToken): AuthMeResponse {
    return { uid: user.uid, claims: user }
  }
}
