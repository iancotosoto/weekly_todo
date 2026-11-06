import Dexie, { type Table } from 'dexie'
import type { Option, Task } from './types'

class AppDB extends Dexie {
  tasks!: Table<Task, string>
  options!: Table<Option, string>
  constructor() {
    super('weekly-todo')
    this.version(1).stores({ tasks: 'id', options: 'id, kind' })
  }
}

export const db = new AppDB()
