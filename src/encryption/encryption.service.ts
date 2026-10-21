import { Injectable } from '@nestjs/common'

import {
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  createPublicKey,
  KeyObject,
  privateEncrypt,
  publicDecrypt,
  randomBytes,
} from 'node:crypto'

import { DecryptionFailedException } from './encryption-exception.filter.js'
import { DecryptedData, EncryptedData } from './encryption.model.js'

const AES_ALGORITHM = 'aes-256-gcm'
const AES_KEY_BYTES = 32
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16

function readKey(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value.replace(/\\n/g, '\n')
}

/**
 * Hybrid encryption: the payload is encrypted with a random AES key (data2),
 * and that key is encrypted with the RSA private key (data1).
 */
@Injectable()
export class EncryptionService {
  private readonly privateKey: KeyObject
  private readonly publicKey: KeyObject

  constructor() {
    this.privateKey = createPrivateKey(readKey('RSA_PRIVATE_KEY'))
    this.publicKey = createPublicKey(readKey('RSA_PUBLIC_KEY'))
  }

  encrypt(payload: string): EncryptedData {
    const aesKey = randomBytes(AES_KEY_BYTES).toString('base64')

    const iv = randomBytes(IV_BYTES)
    const cipher = createCipheriv(
      AES_ALGORITHM,
      Buffer.from(aesKey, 'base64'),
      iv,
    )
    const ciphertext = Buffer.concat([
      cipher.update(payload, 'utf8'),
      cipher.final(),
    ])
    // data2 layout: iv | auth tag | ciphertext
    const data2 = Buffer.concat([iv, cipher.getAuthTag(), ciphertext])

    const data1 = privateEncrypt(this.privateKey, Buffer.from(aesKey, 'utf8'))

    return { data1: data1.toString('base64'), data2: data2.toString('base64') }
  }

  decrypt(data1: string, data2: string): DecryptedData {
    try {
      const aesKey = publicDecrypt(
        this.publicKey,
        Buffer.from(data1, 'base64'),
      ).toString('utf8')
      const key = Buffer.from(aesKey, 'base64')
      if (key.length !== AES_KEY_BYTES) throw new Error('Invalid AES key')

      const raw = Buffer.from(data2, 'base64')
      const iv = raw.subarray(0, IV_BYTES)
      const authTag = raw.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES)
      const ciphertext = raw.subarray(IV_BYTES + AUTH_TAG_BYTES)

      const decipher = createDecipheriv(AES_ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)
      const payload = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8')

      return { payload }
    } catch {
      throw new DecryptionFailedException()
    }
  }
}
