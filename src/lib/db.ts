import Dexie, { type Table } from 'dexie'
import type { Habit, HabitLog, Option, Recurring, RecurringLog, Task } from './types'
import { migrateIntervalHabits } from './recurring'

class AppDB extends Dexie {
  tasks!: Table<Task, string>
  options!: Table<Option, string>
  habits!: Table<Habit, string>
  habitLogs!: Table<HabitLog, string>
  recurrings!: Table<Recurring, string>
  recurringLogs!: Table<RecurringLog, string>
  meta!: Table<{ key: string; value: unknown }, string>
  constructor() {
    super('weekly-todo')
    this.version(1).stores({ tasks: 'id', options: 'id, kind' })
    this.version(2).stores({ tasks: 'id', options: 'id, kind', meta: 'key' })
    this.version(3).stores({ tasks: 'id', options: 'id, kind', meta: 'key', habits: 'id', habitLogs: 'id, habitId, date' })
    this.version(4)
      .stores({
        tasks: 'id',
        options: 'id, kind',
        meta: 'key',
        habits: 'id',
        habitLogs: 'id, habitId, date',
        recurrings: 'id',
        recurringLogs: 'id, recurringId, date',
      })
      .upgrade(async (tx) => {
        const { habits, habitLogs, recurrings, recurringLogs } = migrateIntervalHabits(
          await tx.table('habits').toArray(),
          await tx.table('habitLogs').toArray(),
        )
        await tx.table('recurrings').bulkPut(recurrings)
        await tx.table('recurringLogs').bulkPut(recurringLogs)
        await tx.table('habits').clear()
        await tx.table('habits').bulkPut(habits)
        await tx.table('habitLogs').clear()
        await tx.table('habitLogs').bulkPut(habitLogs)
      })
  }
}

export const db = new AppDB()
