import { inject } from 'vitest'

// Runs before each test file's imports, so AppModule sees this URI.
process.env.MONGODB_URI = inject('mongoUri')
