import { generateKeyPairSync } from 'node:crypto'

// Runs before each test file's imports, so EncryptionService sees these keys.
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})
process.env.RSA_PRIVATE_KEY = privateKey
process.env.RSA_PUBLIC_KEY = publicKey
