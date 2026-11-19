import Dexie, { type Table } from 'dexie'
import type { Habit, HabitLog, Option, Task } from './types'

class AppDB extends Dexie {
  tasks!: Table<Task, string>
  options!: Table<Option, string>
  habits!: Table<Habit, string>
  habitLogs!: Table<HabitLog, string>
  meta!: Table<{ key: string; value: unknown }, string>
  constructor() {
    super('weekly-todo')
    this.version(1).stores({ tasks: 'id', options: 'id, kind' })
    this.version(2).stores({ tasks: 'id', options: 'id, kind', meta: 'key' })
    this.version(3).stores({ tasks: 'id', options: 'id, kind', meta: 'key', habits: 'id', habitLogs: 'id, habitId, date' })
  }
}

export const db = new AppDB()
