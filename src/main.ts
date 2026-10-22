// Must stay first: loads .env before any module reads process.env.
import './env.js'

import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule, ObserveInstrument } from './app.module.js'

const SWAGGER_UI_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.0'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  })
  app.enableCors({ origin: '*' })

  const config = new DocumentBuilder()
    .setTitle('primo-world-assignment')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'BearerAuth',
    )
    .build()
  SwaggerModule.setup(
    'api-docs',
    app,
    () => SwaggerModule.createDocument(app, config),
    // Vercel does not bundle the swagger-ui-dist assets (they are read from
    // disk at runtime), so they 404 and the page renders blank. Load them from
    // a CDN there instead, pinned to the installed swagger-ui-dist version.
    process.env.VERCEL
      ? {
          customCssUrl: `${SWAGGER_UI_CDN}/swagger-ui.css`,
          customJs: [
            `${SWAGGER_UI_CDN}/swagger-ui-bundle.js`,
            `${SWAGGER_UI_CDN}/swagger-ui-standalone-preset.js`,
          ],
        }
      : {},
  )

  // Vercel imports this module, then waits only 1s for `listen()` to be called,
  // and stubs `listen()` so it never resolves. So: finish the slow startup
  // (e.g. the MongoDB connection) before the import completes, then call
  // `listen()` without awaiting it.
  await app.init()
  void app.listen(process.env.PORT ?? 8000)
}
await bootstrap()
