import { envFlag, isFirebaseAuthEnabled, isMongoDbEnabled } from './env-flag.js'

describe('envFlag', () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it.each(['true', 'TRUE', 'True', '1', ' true '])('is on for %j', (value) => {
    process.env.SOME_FLAG = value
    expect(envFlag('SOME_FLAG')).toBe(true)
  })

  it.each(['false', '0', '', 'yes', 'on', 'enabled'])(
    'is off for %j',
    (value) => {
      process.env.SOME_FLAG = value
      expect(envFlag('SOME_FLAG')).toBe(false)
    },
  )

  it('is off when the variable is not set', () => {
    delete process.env.SOME_FLAG
    expect(envFlag('SOME_FLAG')).toBe(false)
  })
})

describe('isFirebaseAuthEnabled', () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it('reads ENABLE_FIREBASE_AUTH', () => {
    process.env.ENABLE_FIREBASE_AUTH = 'true'
    expect(isFirebaseAuthEnabled()).toBe(true)
    process.env.ENABLE_FIREBASE_AUTH = 'false'
    expect(isFirebaseAuthEnabled()).toBe(false)
  })
})

describe('isMongoDbEnabled', () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it('reads ENABLE_MONGODB', () => {
    process.env.ENABLE_MONGODB = 'true'
    expect(isMongoDbEnabled()).toBe(true)
    process.env.ENABLE_MONGODB = 'false'
    expect(isMongoDbEnabled()).toBe(false)
  })
})
