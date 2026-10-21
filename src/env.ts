// Imported first in main.ts so variables are set before any module reads them.
// Real environment variables take precedence over .env.
try {
  process.loadEnvFile()
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
}
