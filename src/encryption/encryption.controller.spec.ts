import { Test, TestingModule } from '@nestjs/testing'

import { DecryptionFailedException } from './encryption-exception.filter.js'
import { EncryptionController } from './encryption.controller.js'
import { EncryptionService } from './encryption.service.js'

describe('EncryptionController', () => {
  let controller: EncryptionController
  const encryptionService = { encrypt: vi.fn(), decrypt: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EncryptionController],
      providers: [{ provide: EncryptionService, useValue: encryptionService }],
    }).compile()

    controller = module.get(EncryptionController)
  })

  it('encrypt wraps the service result in the success envelope', () => {
    encryptionService.encrypt.mockReturnValue({ data1: 'k', data2: 'p' })

    expect(controller.encrypt({ payload: 'hello' })).toEqual({
      successful: true,
      error_code: '',
      data: { data1: 'k', data2: 'p' },
    })
    expect(encryptionService.encrypt).toHaveBeenCalledWith('hello')
  })

  it('decrypt wraps the service result in the success envelope', () => {
    encryptionService.decrypt.mockReturnValue({ payload: 'hello' })

    expect(controller.decrypt({ data1: 'k', data2: 'p' })).toEqual({
      successful: true,
      error_code: '',
      data: { payload: 'hello' },
    })
    expect(encryptionService.decrypt).toHaveBeenCalledWith('k', 'p')
  })

  it('decrypt lets service errors reach the exception filter', () => {
    encryptionService.decrypt.mockImplementation(() => {
      throw new DecryptionFailedException()
    })

    expect(() => controller.decrypt({ data1: 'k', data2: 'p' })).toThrow(
      DecryptionFailedException,
    )
  })
})
