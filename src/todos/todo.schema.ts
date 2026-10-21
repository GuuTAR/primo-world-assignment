import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

import { HydratedDocument } from 'mongoose'

@Schema({
  collection: 'todos',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class TodoEntity {
  /** Firebase UID of the owner. */
  @Prop({ required: true, index: true })
  user_id: string

  @Prop({ required: true, trim: true })
  title: string

  @Prop({ default: false })
  is_completed: boolean

  created_at: Date
  updated_at: Date
}

export type TodoDocument = HydratedDocument<TodoEntity>
export const TodoSchema = SchemaFactory.createForClass(TodoEntity)
