// Must stay first: loads .env before any module reads process.env.
import './env.js'

import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule, ObserveInstrument } from './app.module.js'

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
  SwaggerModule.setup('api-docs', app, () =>
    SwaggerModule.createDocument(app, config),
  )

  // Vercel imports this module, then waits only 1s for `listen()` to be called,
  // and stubs `listen()` so it never resolves. So: finish the slow startup
  // (e.g. the MongoDB connection) before the import completes, then call
  // `listen()` without awaiting it.
  await app.init()
  void app.listen(process.env.PORT ?? 8000)
}
await bootstrap()
