import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'

import {
  DecryptionFailedException,
  EncryptionExceptionFilter,
} from './encryption-exception.filter.js'

describe('EncryptionExceptionFilter', () => {
  const filter = new EncryptionExceptionFilter()
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
  })

  it.each([
    [
      'DecryptionFailedException',
      new DecryptionFailedException(),
      400,
      'DECRYPTION_FAILED',
    ],
    [
      'BadRequestException',
      new BadRequestException(['payload must be a string']),
      400,
      'INVALID_REQUEST',
    ],
    ['other 4xx', new NotFoundException(), 404, 'INVALID_REQUEST'],
    [
      '5xx HttpException',
      new InternalServerErrorException(),
      500,
      'INTERNAL_ERROR',
    ],
    ['non-HTTP error', new Error('boom'), 500, 'INTERNAL_ERROR'],
  ])('maps %s to %i %s', (_, exception, code, errorCode) => {
    filter.catch(exception, host)

    expect(status).toHaveBeenCalledWith(code)
    expect(json).toHaveBeenCalledWith({
      successful: false,
      error_code: errorCode,
      data: null,
    })
  })

  it('logs only unexpected errors', () => {
    filter.catch(new DecryptionFailedException(), host)
    filter.catch(new BadRequestException(), host)
    expect(Logger.prototype.error).not.toHaveBeenCalled()

    const error = new Error('boom')
    filter.catch(error, host)
    expect(Logger.prototype.error).toHaveBeenCalledWith(error)
  })
})
