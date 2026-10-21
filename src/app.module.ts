import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { createObserveModule } from '@nestjs/observe'

import { FirebaseModule } from '@/firebase/firebase.module.js'

import { AuthModule } from '@/auth/auth.module.js'

import { TodosModule } from '@/todos/todos.module.js'

import { AppController } from '@/app.controller.js'
import { AppService } from '@/app.service.js'

export const { ObserveModule, ObserveInstrument } = createObserveModule()

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      runtimeMetrics: !Boolean(process.versions?.['webcontainer']),
      serviceId: 'nest-typescript-starter',
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
      { dbName: process.env.MONGODB_DB_NAME ?? 'testdb' },
    ),
    FirebaseModule,
    AuthModule,
    TodosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
