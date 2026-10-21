import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types.js'
import { AppModule } from '@/app.module.js'

describe('AlgorithmController (e2e)', () => {
  let app: INestApplication<App>

  const merge = (body: object) =>
    request(app.getHttpServer()).post('/merge').send(body)

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('POST /merge returns the merged collections in ascending order', async () => {
    await merge({
      collection_1: [10, 7, 4, 1],
      collection_2: [0, 2, 5, 8],
      collection_3: [0, 3, 6, 9, 12],
    })
      .expect(200)
      .expect({
        code: 200,
        message: 'Collections merged successfully',
        body: { result: [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] },
      })
  })

  it('POST /merge accepts empty collections', async () => {
    await merge({ collection_1: [], collection_2: [], collection_3: [] })
      .expect(200)
      .expect({
        code: 200,
        message: 'Collections merged successfully',
        body: { result: [] },
      })
  })

  it.each([
    ['a missing collection', { collection_1: [], collection_2: [] }],
    [
      'a non-integer element',
      { collection_1: [1.5], collection_2: [], collection_3: [] },
    ],
    [
      'collection_1 sorted ascending',
      { collection_1: [1, 2], collection_2: [], collection_3: [] },
    ],
    [
      'collection_2 sorted descending',
      { collection_1: [], collection_2: [2, 1], collection_3: [] },
    ],
  ])('POST /merge rejects %s with 400', async (_, body) => {
    const res = await merge(body).expect(400)
    expect(res.body).toEqual({ code: 400, message: expect.any(String) })
  })

  it('POST /merge explains an ordering error', async () => {
    await merge({ collection_1: [], collection_2: [], collection_3: [3, 1] })
      .expect(400)
      .expect({
        code: 400,
        message: 'collection_3 must be sorted in ascending order',
      })
  })
})
