import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types.js'

// AppModule picks its modules when it is imported, so each case sets the flag
// and then imports a fresh copy.
const createApp = async (flag: string | undefined) => {
  if (flag === undefined) delete process.env.ENABLE_FIREBASE_AUTH
  else process.env.ENABLE_FIREBASE_AUTH = flag
  vi.resetModules()
  const { AppModule } = await import('@/app.module.js')
  const { FIREBASE_AUTH } = await import('@/firebase/firebase.module.js')

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(FIREBASE_AUTH)
    .useValue({ verifyIdToken: async (token: string) => ({ uid: token }) })
    .compile()
  const app = moduleFixture.createNestApplication<INestApplication<App>>()
  await app.init()
  return { app, FIREBASE_AUTH }
}

describe('ENABLE_FIREBASE_AUTH (e2e)', () => {
  const original = process.env.ENABLE_FIREBASE_AUTH
  let app: INestApplication<App>

  afterEach(async () => {
    await app.close()
    if (original === undefined) delete process.env.ENABLE_FIREBASE_AUTH
    else process.env.ENABLE_FIREBASE_AUTH = original
  })

  describe.each([
    ['unset', undefined],
    ['false', 'false'],
    ['empty', ''],
    ['an unknown value', 'yes'],
  ])('when %s', (_, flag) => {
    beforeEach(async () => {
      ;({ app } = await createApp(flag))
    })

    it.each([
      ['GET', '/api/v1/todos'],
      ['GET', '/api/v1/auth/me'],
      ['POST', '/api/v1/auth/signin'],
    ])('does not register %s %s', async (method, path) => {
      await request(app.getHttpServer())
        [method === 'GET' ? 'get' : 'post'](path)
        .expect(404)
    })

    it('does not load Firebase', async () => {
      const { FIREBASE_AUTH } = await import('@/firebase/firebase.module.js')
      expect(() => app.get(FIREBASE_AUTH)).toThrow()
    })

    it('still serves the modules that do not need auth', async () => {
      await request(app.getHttpServer())
        .post('/merge')
        .send({ collection_1: [2], collection_2: [0], collection_3: [1] })
        .expect(200)
      await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send({ payload: 'hi' })
        .expect(200)
    })
  })

  describe.each([
    ['true', 'true'],
    ['TRUE', 'TRUE'],
    ['1', '1'],
  ])('when %s', (_, flag) => {
    beforeEach(async () => {
      ;({ app } = await createApp(flag))
    })

    it('registers the auth and todos routes', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/todos')
        .expect(401)
        .expect({ code: 401, message: 'Missing bearer token' })
      await request(app.getHttpServer())
        .get('/api/v1/todos')
        .set({ Authorization: 'Bearer user-1' })
        .expect(200)
    })

    it('loads Firebase', async () => {
      const { FIREBASE_AUTH } = await import('@/firebase/firebase.module.js')
      expect(app.get(FIREBASE_AUTH)).toBeDefined()
    })
  })
})
