import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types.js'
import { AppModule } from '@/app.module.js'

describe('EncryptionController (e2e)', () => {
  let app: INestApplication<App>

  const encrypt = (body: object) =>
    request(app.getHttpServer()).post('/get-encrypt-data').send(body)
  const decrypt = (body: object) =>
    request(app.getHttpServer()).post('/get-decrypt-data').send(body)

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

  it.each(['Hello, world!', '', 'สวัสดี 👋', 'x'.repeat(2000)])(
    'round-trips payload %#',
    async (payload) => {
      const encrypted = await encrypt({ payload }).expect(200)
      expect(encrypted.body).toEqual({
        successful: true,
        error_code: '',
        data: { data1: expect.any(String), data2: expect.any(String) },
      })

      await decrypt(encrypted.body.data)
        .expect(200)
        .expect({ successful: true, error_code: '', data: { payload } })
    },
  )

  it('uses a fresh AES key per request', async () => {
    const a = await encrypt({ payload: 'same' })
    const b = await encrypt({ payload: 'same' })
    expect(a.body.data.data1).not.toBe(b.body.data.data1)
    expect(a.body.data.data2).not.toBe(b.body.data.data2)
  })

  it.each([{}, { payload: 123 }, { payload: 'x'.repeat(2001) }])(
    'POST /get-encrypt-data rejects %j',
    async (body) => {
      await encrypt(body).expect(400).expect({
        successful: false,
        error_code: 'INVALID_REQUEST',
        data: null,
      })
    },
  )

  it.each([
    {},
    { data1: 'a' },
    { data1: '', data2: 'b' },
    { data1: 1, data2: 2 },
  ])('POST /get-decrypt-data rejects %j', async (body) => {
    await decrypt(body)
      .expect(400)
      .expect({ successful: false, error_code: 'INVALID_REQUEST', data: null })
  })

  it('POST /get-decrypt-data fails on tampered data', async () => {
    const { data1, data2 } = (await encrypt({ payload: 'secret' })).body.data
    const other = (await encrypt({ payload: 'other' })).body.data
    const failed = {
      successful: false,
      error_code: 'DECRYPTION_FAILED',
      data: null,
    }

    await decrypt({ data1: 'garbage', data2 }).expect(400).expect(failed)
    await decrypt({ data1: other.data1, data2 }).expect(400).expect(failed)
    const tampered = Buffer.from(data2, 'base64')
    tampered[tampered.length - 1] ^= 1
    await decrypt({ data1, data2: tampered.toString('base64') })
      .expect(400)
      .expect(failed)
  })
})
