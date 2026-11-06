import Dexie, { type Table } from 'dexie'
import type { Option, Task } from './types'

class AppDB extends Dexie {
  tasks!: Table<Task, string>
  options!: Table<Option, string>
  meta!: Table<{ key: string; value: unknown }, string>
  constructor() {
    super('weekly-todo')
    this.version(1).stores({ tasks: 'id', options: 'id, kind' })
    this.version(2).stores({ tasks: 'id', options: 'id, kind', meta: 'key' })
  }
}

export const db = new AppDB()
