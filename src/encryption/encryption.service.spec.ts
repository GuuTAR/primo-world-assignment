import { generateKeyPairSync, privateEncrypt } from 'node:crypto'

import { DecryptionFailedException } from './encryption-exception.filter.js'
import { EncryptionService } from './encryption.service.js'

const generateKeys = () =>
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })

describe('EncryptionService', () => {
  const keys = generateKeys()
  const originalEnv = { ...process.env }
  let service: EncryptionService

  beforeEach(() => {
    process.env.RSA_PRIVATE_KEY = keys.privateKey
    process.env.RSA_PUBLIC_KEY = keys.publicKey
    service = new EncryptionService()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('constructor', () => {
    it.each(['RSA_PRIVATE_KEY', 'RSA_PUBLIC_KEY'])(
      'throws when %s is not set',
      (name) => {
        delete process.env[name]
        expect(() => new EncryptionService()).toThrow(`${name} is not set`)
      },
    )

    it('throws when a key is not valid PEM', () => {
      process.env.RSA_PRIVATE_KEY = 'not a key'
      expect(() => new EncryptionService()).toThrow()
    })

    it('accepts keys with escaped newlines, as stored in .env', () => {
      process.env.RSA_PRIVATE_KEY = keys.privateKey.replace(/\n/g, '\\n')
      process.env.RSA_PUBLIC_KEY = keys.publicKey.replace(/\n/g, '\\n')
      const { data1, data2 } = new EncryptionService().encrypt('hi')
      expect(service.decrypt(data1, data2)).toEqual({ payload: 'hi' })
    })
  })

  describe('encrypt', () => {
    it('returns base64 data1 and data2', () => {
      const { data1, data2 } = service.encrypt('Hello, world!')
      expect(data1).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
      expect(data2).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
    })

    it('encrypts the AES key into data1 with the RSA key size', () => {
      const { data1 } = service.encrypt('Hello, world!')
      expect(Buffer.from(data1, 'base64')).toHaveLength(256)
    })

    it('lays out data2 as iv (12) | auth tag (16) | ciphertext', () => {
      const payload = 'x'.repeat(100)
      const { data2 } = service.encrypt(payload)
      expect(Buffer.from(data2, 'base64')).toHaveLength(12 + 16 + 100)
    })

    it('does not leak the payload in plaintext', () => {
      const payload = 'top secret payload'
      const { data2 } = service.encrypt(payload)
      expect(Buffer.from(data2, 'base64').toString('utf8')).not.toContain(
        payload,
      )
    })

    it('uses a fresh AES key and IV per call', () => {
      const a = service.encrypt('same')
      const b = service.encrypt('same')
      expect(a.data1).not.toBe(b.data1)
      expect(a.data2).not.toBe(b.data2)

      const iv = (data2: string) => Buffer.from(data2, 'base64').subarray(0, 12)
      expect(iv(a.data2).equals(iv(b.data2))).toBe(false)
    })
  })

  describe('decrypt', () => {
    it.each([
      ['ascii', 'Hello, world!'],
      ['empty', ''],
      ['unicode', 'สวัสดี 👋'],
      ['max length', 'x'.repeat(2000)],
    ])('round-trips a %s payload', (_, payload) => {
      const { data1, data2 } = service.encrypt(payload)
      expect(service.decrypt(data1, data2)).toEqual({ payload })
    })

    it('fails when data1 is not RSA-encrypted', () => {
      const { data2 } = service.encrypt('secret')
      expect(() => service.decrypt('garbage', data2)).toThrow(
        DecryptionFailedException,
      )
    })

    it('fails when data1 was encrypted with a different key pair', () => {
      const { data1, data2 } = service.encrypt('secret')
      const other = generateKeys()
      process.env.RSA_PRIVATE_KEY = other.privateKey
      process.env.RSA_PUBLIC_KEY = other.publicKey
      expect(() => new EncryptionService().decrypt(data1, data2)).toThrow(
        DecryptionFailedException,
      )
    })

    it('fails when data1 does not hold a 32-byte AES key', () => {
      const { data2 } = service.encrypt('secret')
      const shortKey = privateEncrypt(
        keys.privateKey,
        Buffer.from(Buffer.alloc(16).toString('base64')),
      ).toString('base64')
      expect(() => service.decrypt(shortKey, data2)).toThrow(
        DecryptionFailedException,
      )
    })

    it('fails when data1 belongs to another payload', () => {
      const { data2 } = service.encrypt('secret')
      const { data1 } = service.encrypt('other')
      expect(() => service.decrypt(data1, data2)).toThrow(
        DecryptionFailedException,
      )
    })

    it.each([
      ['iv', 0],
      ['auth tag', 12],
      ['ciphertext', 28],
    ])('fails when the %s in data2 is tampered with', (_, offset) => {
      const { data1, data2 } = service.encrypt('secret')
      const tampered = Buffer.from(data2, 'base64')
      tampered[offset] ^= 1
      expect(() => service.decrypt(data1, tampered.toString('base64'))).toThrow(
        DecryptionFailedException,
      )
    })

    it('fails when data2 is truncated', () => {
      const { data1 } = service.encrypt('secret')
      expect(() =>
        service.decrypt(data1, Buffer.alloc(8).toString('base64')),
      ).toThrow(DecryptionFailedException)
    })
  })
})
