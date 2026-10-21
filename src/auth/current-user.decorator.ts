import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import type { AuthenticatedRequest } from '@/auth/firebase-auth.guard.js'

/** The decoded Firebase ID token set by `FirebaseAuthGuard`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
)
