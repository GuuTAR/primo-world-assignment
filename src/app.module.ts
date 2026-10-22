import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { createObserveModule } from '@nestjs/observe'

import { isFirebaseAuthEnabled, isMongoDbEnabled } from './common/env-flag.js'

import { FirebaseModule } from './firebase/firebase.module.js'

import { AlgorithmModule } from './algorithm/algorithm.module.js'

import { AuthModule } from './auth/auth.module.js'

import { EncryptionModule } from './encryption/encryption.module.js'

import { TodosModule } from './todos/todos.module.js'

import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'

export const { ObserveModule, ObserveInstrument } = createObserveModule()

const firebaseAuth = isFirebaseAuthEnabled()
const mongoDb = isMongoDbEnabled()

// Each feature is left out when its flag is off. Todos needs both.
const firebaseAuthModules = firebaseAuth ? [FirebaseModule, AuthModule] : []
const mongoDbModules = mongoDb
  ? [
      MongooseModule.forRoot(
        process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
        { dbName: process.env.MONGODB_DB_NAME ?? 'testdb' },
      ),
    ]
  : []
const todosModules = firebaseAuth && mongoDb ? [TodosModule] : []

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
    ...mongoDbModules,
    ...firebaseAuthModules,
    ...todosModules,
    EncryptionModule,
    AlgorithmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
