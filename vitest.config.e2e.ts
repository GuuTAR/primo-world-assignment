import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/mongo.global-setup.ts'],
    setupFiles: ['./test/mongo.setup.ts', './test/rsa.setup.ts'],
    // Auth and todos tests need these modules; firebase-auth-flag.e2e-spec.ts
    // covers the disabled case.
    env: { ENABLE_FIREBASE_AUTH: 'true' },
  },
});
