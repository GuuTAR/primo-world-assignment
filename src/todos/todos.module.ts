import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '@/auth/auth.module.js'

import { TodoEntity, TodoSchema } from '@/todos/todo.schema.js'
import { TodosController } from '@/todos/todos.controller.js'
import { TodosService } from '@/todos/todos.service.js'

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: TodoEntity.name, schema: TodoSchema }]),
  ],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
