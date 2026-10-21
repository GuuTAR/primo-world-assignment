import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types.js'
import { AppModule } from '@/app.module.js'
import { FIREBASE_AUTH } from '@/firebase/firebase.module.js'

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>
  const verifyIdToken = vi.fn()
  const fetchMock = vi.fn()

  beforeEach(async () => {
    process.env.FIREBASE_API_KEY = 'test-key'
    vi.stubGlobal('fetch', fetchMock)

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FIREBASE_AUTH)
      .useValue({ verifyIdToken })
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
    await app.close()
  })

  describe('POST /api/v1/auth/signin', () => {
    it('returns tokens for valid credentials', async () => {
      fetchMock.mockResolvedValue(
        Response.json({
          idToken: 'id',
          refreshToken: 'refresh',
          expiresIn: '3600',
          localId: 'user-1',
          email: 'a@b.com',
        }),
      )

      await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({ email: 'a@b.com', password: 'secret' })
        .expect(200)
        .expect({
          code: 200,
          message: 'Success',
          body: {
            token: 'id',
            expires_in: 3600,
            uid: 'user-1',
            email: 'a@b.com',
          },
        })
    })

    it('rejects an invalid body with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({ email: 'not-an-email' })
        .expect(400)
      expect(res.body).toEqual({ code: 400, message: expect.any(String) })
      expect(res.body).not.toHaveProperty('body')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('returns 401 for wrong credentials', async () => {
      fetchMock.mockResolvedValue(
        Response.json(
          { error: { message: 'INVALID_LOGIN_CREDENTIALS' } },
          { status: 400 },
        ),
      )

      await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({ email: 'a@b.com', password: 'wrong' })
        .expect(401)
        .expect({ code: 401, message: 'Invalid email or password' })
    })

    it('returns 500 for unexpected Firebase errors', async () => {
      fetchMock.mockResolvedValue(
        Response.json(
          { error: { message: 'TOO_MANY_ATTEMPTS_TRY_LATER : blocked' } },
          { status: 400 },
        ),
      )

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({ email: 'a@b.com', password: 'secret' })
        .expect(500)
      expect(res.body).toEqual({
        code: 500,
        message: 'Firebase sign-in failed: TOO_MANY_ATTEMPTS_TRY_LATER',
      })
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('returns uid and claims for a valid token', async () => {
      const claims = { uid: 'user-1', email: 'a@b.com', admin: true }
      verifyIdToken.mockResolvedValue(claims)

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer good-token')
        .expect(200)
        .expect({
          code: 200,
          message: 'User retrieved successfully',
          body: { uid: 'user-1', claims },
        })
      expect(verifyIdToken).toHaveBeenCalledWith('good-token')
    })

    it('returns 401 without a bearer token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401)
        .expect({ code: 401, message: 'Missing bearer token' })
    })

    it('returns 401 for an invalid token', () => {
      verifyIdToken.mockRejectedValue(new Error('bad token'))

      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer bad-token')
        .expect(401)
        .expect({ code: 401, message: 'Invalid or expired token' })
    })
  })
})
