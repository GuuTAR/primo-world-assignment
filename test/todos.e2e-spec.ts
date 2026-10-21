import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import type { Connection } from 'mongoose'
import request from 'supertest'
import type { App } from 'supertest/types.js'
import { AppModule } from '@/app.module.js'
import { FIREBASE_AUTH } from '@/firebase/firebase.module.js'

describe('TodosController (e2e)', () => {
  let app: INestApplication<App>
  // The bearer token is used as the UID, e.g. "Bearer user-1" -> uid "user-1".
  const verifyIdToken = vi.fn(async (token: string) => ({ uid: token }))
  const asUser = (uid: string) => ({ Authorization: `Bearer ${uid}` })

  const createTodo = async (title: string, uid = 'user-1') => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/todos')
      .set(asUser(uid))
      .send({ title })
      .expect(201)
    return res.body.body
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FIREBASE_AUTH)
      .useValue({ verifyIdToken })
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    await app
      .get<Connection>(getConnectionToken())
      .collection('todos')
      .deleteMany({})
  })

  afterEach(async () => {
    await app.close()
  })

  it('requires a bearer token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/todos')
      .expect(401)
      .expect({ code: 401, message: 'Missing bearer token' })
  })

  it('POST /api/v1/todos creates a todo', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/todos')
      .set(asUser('user-1'))
      .send({ title: 'Buy milk' })
      .expect(201)

    expect(res.body).toEqual({
      code: 201,
      message: 'Todo created successfully',
      body: {
        id: expect.stringMatching(/^[0-9a-f]{24}$/),
        title: 'Buy milk',
        is_completed: false,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    })
  })

  it('POST /api/v1/todos rejects a missing title', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/todos')
      .set(asUser('user-1'))
      .send({})
      .expect(400)
    expect(res.body).toEqual({ code: 400, message: expect.any(String) })
  })

  it('GET /api/v1/todos lists only the caller’s todos, newest first', async () => {
    await createTodo('First')
    await createTodo('Second')
    await createTodo('Someone else’s', 'user-2')

    const res = await request(app.getHttpServer())
      .get('/api/v1/todos')
      .set(asUser('user-1'))
      .expect(200)

    expect(res.body).toMatchObject({
      code: 200,
      message: 'Todos retrieved successfully',
    })
    expect(res.body.body.map((t: { title: string }) => t.title)).toEqual([
      'Second',
      'First',
    ])
  })

  it('PATCH /api/v1/todos-toggle/:id flips completed', async () => {
    const created = await createTodo('Buy milk')
    const { id } = created

    const first = await request(app.getHttpServer())
      .patch(`/api/v1/todos-toggle/${id}`)
      .set(asUser('user-1'))
      .expect(200)
    expect(first.body).toMatchObject({
      code: 200,
      message: 'Todo toggled successfully',
    })
    expect(first.body.body).toMatchObject({ id, is_completed: true })
    expect(first.body.body.created_at).toBe(created.created_at)
    expect(first.body.body.updated_at > created.updated_at).toBe(true)

    const second = await request(app.getHttpServer())
      .patch(`/api/v1/todos-toggle/${id}`)
      .set(asUser('user-1'))
      .expect(200)
    expect(second.body.body).toMatchObject({ id, is_completed: false })
  })

  it('PATCH /api/v1/todos-toggle/:id returns 400 for an invalid ID and 404 for another user’s todo', async () => {
    const { id } = await createTodo('Buy milk')

    await request(app.getHttpServer())
      .patch('/api/v1/todos-toggle/not-an-id')
      .set(asUser('user-1'))
      .expect(400)
    await request(app.getHttpServer())
      .patch(`/api/v1/todos-toggle/${id}`)
      .set(asUser('user-2'))
      .expect(404)
      .expect({ code: 404, message: 'Todo not found' })
  })

  it('PATCH /api/v1/todos-reset marks only the caller’s todos not completed', async () => {
    const mine = await createTodo('Mine')
    const theirs = await createTodo('Theirs', 'user-2')
    for (const [todo, uid] of [
      [mine, 'user-1'],
      [theirs, 'user-2'],
    ]) {
      await request(app.getHttpServer())
        .patch(`/api/v1/todos-toggle/${todo.id}`)
        .set(asUser(uid))
        .expect(200)
    }

    await request(app.getHttpServer())
      .patch('/api/v1/todos-reset')
      .set(asUser('user-1'))
      .expect(200)
      .expect({ code: 200, message: 'Todos reset successfully' })

    const list = async (uid: string) =>
      (await request(app.getHttpServer()).get('/api/v1/todos').set(asUser(uid)))
        .body.body
    expect((await list('user-1'))[0].is_completed).toBe(false)
    expect((await list('user-2'))[0].is_completed).toBe(true)
  })

  it('DELETE /api/v1/todos/:id deletes the todo', async () => {
    const { id } = await createTodo('Buy milk')

    await request(app.getHttpServer())
      .delete(`/api/v1/todos/${id}`)
      .set(asUser('user-2'))
      .expect(404)
    await request(app.getHttpServer())
      .delete(`/api/v1/todos/${id}`)
      .set(asUser('user-1'))
      .expect(200)
      .expect({ code: 200, message: 'Todo deleted successfully' })
    await request(app.getHttpServer())
      .delete(`/api/v1/todos/${id}`)
      .set(asUser('user-1'))
      .expect(404)
      .expect({ code: 404, message: 'Todo not found' })
  })
})
