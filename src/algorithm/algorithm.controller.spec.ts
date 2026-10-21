import { Test, TestingModule } from '@nestjs/testing'

import { AlgorithmController } from './algorithm.controller.js'
import { AlgorithmService } from './algorithm.service.js'

describe('AlgorithmController', () => {
  let controller: AlgorithmController
  const algorithmService = { merge: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlgorithmController],
      providers: [{ provide: AlgorithmService, useValue: algorithmService }],
    }).compile()

    controller = module.get(AlgorithmController)
  })

  it('passes the three collections to the service in order', () => {
    algorithmService.merge.mockReturnValue([0, 1, 2])

    expect(
      controller.merge({
        collection_1: [2],
        collection_2: [0],
        collection_3: [1],
      }),
    ).toEqual({ result: [0, 1, 2] })
    expect(algorithmService.merge).toHaveBeenCalledWith([2], [0], [1])
  })
})
