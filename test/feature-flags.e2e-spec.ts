import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import request from 'supertest'
import type { App } from 'supertest/types.js'

type Flags = {
  ENABLE_FIREBASE_AUTH?: string
  ENABLE_MONGODB?: string
  MONGODB_URI?: string
}

const setEnv = (env: Flags) => {
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
}

// AppModule picks its modules when it is imported, so each case sets the
// flags and then imports a fresh copy.
const createApp = async (flags: Flags) => {
  setEnv(flags)
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
  return app
}

const original: Flags = {
  ENABLE_FIREBASE_AUTH: process.env.ENABLE_FIREBASE_AUTH,
  ENABLE_MONGODB: process.env.ENABLE_MONGODB,
  MONGODB_URI: process.env.MONGODB_URI,
}

const hasFirebase = async (app: INestApplication) => {
  const { FIREBASE_AUTH } = await import('@/firebase/firebase.module.js')
  try {
    return app.get(FIREBASE_AUTH) !== undefined
  } catch {
    return false
  }
}

const hasMongoConnection = (app: INestApplication) => {
  try {
    return app.get(getConnectionToken()) !== undefined
  } catch {
    return false
  }
}

const OFF_VALUES: [string, string | undefined][] = [
  ['unset', undefined],
  ['false', 'false'],
  ['empty', ''],
  ['an unknown value', 'yes'],
]
const ON_VALUES: [string, string][] = [
  ['true', 'true'],
  ['TRUE', 'TRUE'],
  ['1', '1'],
]

describe('feature flags (e2e)', () => {
  let app: INestApplication<App>

  afterEach(async () => {
    await app?.close()
    setEnv(original)
  })

  const expectAlwaysOnRoutes = async () => {
    await request(app.getHttpServer())
      .post('/merge')
      .send({ collection_1: [2], collection_2: [0], collection_3: [1] })
      .expect(200)
    await request(app.getHttpServer())
      .post('/get-encrypt-data')
      .send({ payload: 'hi' })
      .expect(200)
  }

  describe('ENABLE_FIREBASE_AUTH', () => {
    describe.each(OFF_VALUES)('when %s', (_, flag) => {
      beforeEach(async () => {
        app = await createApp({
          ENABLE_FIREBASE_AUTH: flag,
          ENABLE_MONGODB: 'true',
        })
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
        expect(await hasFirebase(app)).toBe(false)
      })

      it('still serves the modules that do not need auth', async () => {
        await expectAlwaysOnRoutes()
      })
    })

    describe.each(ON_VALUES)('when %s', (_, flag) => {
      beforeEach(async () => {
        app = await createApp({
          ENABLE_FIREBASE_AUTH: flag,
          ENABLE_MONGODB: 'true',
        })
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
        expect(await hasFirebase(app)).toBe(true)
      })
    })
  })

  describe('ENABLE_MONGODB', () => {
    describe.each(OFF_VALUES)('when %s', (_, flag) => {
      beforeEach(async () => {
        app = await createApp({
          ENABLE_FIREBASE_AUTH: 'true',
          ENABLE_MONGODB: flag,
        })
      })

      it('does not connect to MongoDB', () => {
        expect(hasMongoConnection(app)).toBe(false)
      })

      it('does not register the todos routes', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/todos')
          .set({ Authorization: 'Bearer user-1' })
          .expect(404)
      })

      it('keeps the auth routes, which do not need MongoDB', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set({ Authorization: 'Bearer user-1' })
          .expect(200)
      })

      it('still serves the modules that do not need MongoDB', async () => {
        await expectAlwaysOnRoutes()
      })
    })

    it('starts without trying an unreachable MONGODB_URI when off', async () => {
      const start = Date.now()
      app = await createApp({
        ENABLE_FIREBASE_AUTH: 'true',
        ENABLE_MONGODB: 'false',
        MONGODB_URI: 'mongodb://127.0.0.1:1',
      })
      expect(Date.now() - start).toBeLessThan(5000)
      await expectAlwaysOnRoutes()
    })

    describe.each(ON_VALUES)('when %s', (_, flag) => {
      it('connects to MongoDB', async () => {
        app = await createApp({
          ENABLE_FIREBASE_AUTH: 'true',
          ENABLE_MONGODB: flag,
        })
        expect(hasMongoConnection(app)).toBe(true)
      })
    })

    it('does not register todos when MongoDB is on but auth is off', async () => {
      app = await createApp({
        ENABLE_FIREBASE_AUTH: 'false',
        ENABLE_MONGODB: 'true',
      })
      expect(hasMongoConnection(app)).toBe(true)
      await request(app.getHttpServer()).get('/api/v1/todos').expect(404)
    })
  })

  it('serves only the always-on modules when both flags are off', async () => {
    app = await createApp({
      ENABLE_FIREBASE_AUTH: 'false',
      ENABLE_MONGODB: 'false',
    })
    expect(await hasFirebase(app)).toBe(false)
    expect(hasMongoConnection(app)).toBe(false)
    await request(app.getHttpServer()).get('/api/v1/todos').expect(404)
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(404)
    await expectAlwaysOnRoutes()
  })
})
