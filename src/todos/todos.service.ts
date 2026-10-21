import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'

import { isValidObjectId, Model } from 'mongoose'

import { Todo } from '@/todos/todo.model.js'
import { TodoEntity } from '@/todos/todo.schema.js'

type TodoRecord = TodoEntity & { _id: unknown }

/** All operations are scoped to the caller's Firebase UID. */
@Injectable()
export class TodosService {
  constructor(
    @InjectModel(TodoEntity.name) private readonly todoModel: Model<TodoEntity>,
  ) {}

  async findAll(userId: string): Promise<Todo[]> {
    const todos = await this.todoModel
      .find({ user_id: userId })
      .sort({ created_at: -1, _id: -1 })
      .lean()
    return todos.map(toTodo)
  }

  async create(userId: string, title: string): Promise<Todo> {
    const todo = await this.todoModel.create({ user_id: userId, title })
    return toTodo(todo.toObject())
  }

  async resetAll(userId: string): Promise<void> {
    await this.todoModel.updateMany(
      { user_id: userId },
      { is_completed: false },
    )
  }

  async toggle(userId: string, id: string): Promise<Todo> {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid todo ID')

    const todo = await this.todoModel
      .findOneAndUpdate(
        { _id: id, user_id: userId },
        [{ $set: { is_completed: { $not: '$is_completed' } } }],
        { new: true, updatePipeline: true },
      )
      .lean()
    if (!todo) throw new NotFoundException('Todo not found')
    return toTodo(todo)
  }

  async delete(userId: string, id: string): Promise<void> {
    if (!isValidObjectId(id)) throw new NotFoundException('Todo not found')

    const { deletedCount } = await this.todoModel.deleteOne({
      _id: id,
      user_id: userId,
    })
    if (deletedCount === 0) throw new NotFoundException('Todo not found')
  }
}

function toTodo({
  _id,
  title,
  is_completed,
  created_at,
  updated_at,
}: TodoRecord): Todo {
  return { id: String(_id), title, is_completed, created_at, updated_at }
}
