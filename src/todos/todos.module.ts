import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '../auth/auth.module.js'

import { TodoEntity, TodoSchema } from './todo.schema.js'
import { TodosController } from './todos.controller.js'
import { TodosService } from './todos.service.js'

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: TodoEntity.name, schema: TodoSchema }]),
  ],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
