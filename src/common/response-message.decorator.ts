import { SetMetadata } from '@nestjs/common'

export const RESPONSE_MESSAGE = 'response_message'

/** Sets the `message` of a successful response. */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE, message)
