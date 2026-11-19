import { create } from 'zustand'
import { db } from './db'
import { DEFAULT_OPTIONS, SEED_TASKS } from './seed'
import { logKey, todayStr } from './habits'
import { latestLog, migrateIntervalHabits, recurringLogKey } from './recurring'
import { DONE_ID, TODO_ID, type Container, type Habit, type HabitLog, type Option, type OptionKind, type Recurring, type RecurringLog, type Task } from './types'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
import { BASIC_COLORS } from './colors'

interface State {
  ready: boolean
  tasks: Task[]
  options: Option[]
  customColors: string[]
  habits: Habit[]
  habitLogs: HabitLog[]
  recurrings: Recurring[]
  recurringLogs: RecurringLog[]
  load: () => Promise<void>
  addTask: (p: Partial<Task>) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleDone: (id: string) => void
  moveTask: (id: string, container: Container, index: number) => void
  addOption: (kind: OptionKind, label: string) => Option
  setOptionColor: (id: string, color: string) => void
  deleteProject: (id: string) => void
  addCustomColor: (hex: string) => void
  removeCustomColor: (hex: string) => void
  clearTasks: () => void
  addHabit: (p: Partial<Habit>) => Habit
  updateHabit: (id: string, patch: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  logHabit: (habitId: string, date: string, count: number) => void
  clearHabitLogs: () => void
  addRecurring: (p: Partial<Recurring>) => Recurring
  updateRecurring: (id: string, patch: Partial<Recurring>) => void
  deleteRecurring: (id: string) => void
  completeRecurring: (id: string, date: string) => void
  undoRecurring: (id: string, date: string) => void
  clearRecurringLogs: () => void
  exportJSON: () => string
  importJSON: (json: string) => void
}

let timer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const { tasks, options, customColors } = useStore.getState()
    await db.transaction('rw', db.tasks, db.options, db.meta, async () => {
      await db.meta.put({ key: 'customColors', value: customColors })
      await db.tasks.clear()
      await db.options.clear()
      await db.tasks.bulkPut(tasks)
      await db.options.bulkPut(options)
    })
  }, 150)
}

export const sortByOrder = (a: Task, b: Task) => a.order - b.order

export const useStore = create<State>((set, get) => ({
  ready: false,
  tasks: [],
  options: [],
  customColors: [],
  habits: [],
  habitLogs: [],
  recurrings: [],
  recurringLogs: [],

  load: async () => {
    const [tasks, options, cc, habits, habitLogs, recurrings, recurringLogs] = await Promise.all([
      db.tasks.toArray(),
      db.options.toArray(),
      db.meta.get('customColors'),
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.recurrings.toArray(),
      db.recurringLogs.toArray(),
    ])
    const customColors = (cc?.value as string[] | undefined) ?? []
    if (!options.length && !tasks.length && !habits.length && !recurrings.length) {
      set({ tasks: SEED_TASKS, options: DEFAULT_OPTIONS, customColors, habits, habitLogs, recurrings, recurringLogs, ready: true })
      persist()
    } else {
      set({ tasks, options, customColors, habits, habitLogs, recurrings, recurringLogs, ready: true })
    }
  },

  addTask: (p) => {
    const container = p.weekday ?? null
    const max = Math.max(-1, ...get().tasks.filter((t) => t.weekday === container).map((t) => t.order))
    const task: Task = {
      id: uid(),
      name: '',
      projectId: null,
      date: null,
      time: null,
      weekday: container,
      statusId: TODO_ID,
      importanceId: 'im-mid',
      order: max + 1,
      createdAt: Date.now(),
      ...p,
    }
    set((s) => ({ tasks: [...s.tasks, task] }))
    persist()
    return task
  },

  updateTask: (id, patch) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    persist()
  },

  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    persist()
  },

  toggleDone: (id) => {
    const t = get().tasks.find((x) => x.id === id)
    if (t) get().updateTask(id, { statusId: t.statusId === DONE_ID ? TODO_ID : DONE_ID })
  },

  // Mueve una tarea a un contenedor (día o bandeja) en la posición `index`.
  moveTask: (id, container, index) => {
    set((s) => {
      const moving = s.tasks.find((t) => t.id === id)
      if (!moving) return s
      const target = s.tasks
        .filter((t) => t.id !== id && t.weekday === container)
        .sort(sortByOrder)
      target.splice(Math.max(0, Math.min(index, target.length)), 0, { ...moving, weekday: container })
      const updated = new Map(target.map((t, i) => [t.id, { ...t, order: i }]))
      return { tasks: s.tasks.map((t) => updated.get(t.id) ?? t) }
    })
    persist()
  },

  addOption: (kind, label) => {
    const taken = get().options.filter((o) => o.kind === kind).map((o) => o.color)
    const color = BASIC_COLORS.find((c) => !taken.includes(c)) ?? BASIC_COLORS[taken.length % BASIC_COLORS.length]
    const opt: Option = { id: uid(), kind, label: label.trim(), color }
    set((s) => ({ options: [...s.options, opt] }))
    persist()
    return opt
  },

  setOptionColor: (id, color) => {
    set((s) => ({ options: s.options.map((o) => (o.id === id ? { ...o, color } : o)) }))
    persist()
  },

  deleteProject: (id) => {
    set((s) => ({
      options: s.options.filter((o) => o.id !== id),
      tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
    }))
    persist()
  },

  addCustomColor: (hex) => {
    const h = hex.toLowerCase()
    set((s) => (s.customColors.includes(h) ? s : { customColors: [...s.customColors, h] }))
    persist()
  },

  removeCustomColor: (hex) => {
    set((s) => ({ customColors: s.customColors.filter((c) => c !== hex) }))
    persist()
  },

  clearTasks: () => {
    set({ tasks: [] })
    persist()
  },

  // Los hábitos y su registro se guardan de forma incremental (no se reescribe todo en cada check)
  addHabit: (p) => {
    const max = Math.max(-1, ...get().habits.map((h) => h.order))
    const habit: Habit = {
      id: uid(),
      name: '',
      color: null,
      order: max + 1,
      createdAt: Date.now(),
      archived: false,
      startDate: todayStr(),
      mode: 'daily',
      weekdays: [],
      monthDays: [],
      yearDates: [],
      every: { n: 1, unit: 'days' },
      goalWeek: null,
      goalMonth: null,
      ...p,
    }
    set((s) => ({ habits: [...s.habits, habit] }))
    void db.habits.put(habit)
    return habit
  },

  updateHabit: (id, patch) => {
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) }))
    const h = get().habits.find((x) => x.id === id)
    if (h) void db.habits.put(h)
  },

  deleteHabit: (id) => {
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id), habitLogs: s.habitLogs.filter((l) => l.habitId !== id) }))
    void db.transaction('rw', db.habits, db.habitLogs, async () => {
      await db.habits.delete(id)
      await db.habitLogs.where('habitId').equals(id).delete()
    })
  },

  logHabit: (habitId, date, count) => {
    const id = logKey(habitId, date)
    const c = Math.max(0, count)
    set((s) => {
      const rest = s.habitLogs.filter((l) => l.id !== id)
      return { habitLogs: c > 0 ? [...rest, { id, habitId, date, count: c }] : rest }
    })
    void (c > 0 ? db.habitLogs.put({ id, habitId, date, count: c }) : db.habitLogs.delete(id))
  },

  clearHabitLogs: () => {
    set({ habitLogs: [] })
    void db.habitLogs.clear()
  },

  addRecurring: (p) => {
    const max = Math.max(-1, ...get().recurrings.map((r) => r.order))
    const rec: Recurring = {
      id: uid(),
      name: '',
      color: null,
      order: max + 1,
      createdAt: Date.now(),
      archived: false,
      startDate: todayStr(),
      deadlines: [{ n: 7, unit: 'days' }],
      lastDone: null,
      ...p,
    }
    set((s) => ({ recurrings: [...s.recurrings, rec] }))
    void db.recurrings.put(rec)
    return rec
  },

  updateRecurring: (id, patch) => {
    set((s) => ({ recurrings: s.recurrings.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
    const r = get().recurrings.find((x) => x.id === id)
    if (r) void db.recurrings.put(r)
  },

  deleteRecurring: (id) => {
    set((s) => ({ recurrings: s.recurrings.filter((r) => r.id !== id), recurringLogs: s.recurringLogs.filter((l) => l.recurringId !== id) }))
    void db.transaction('rw', db.recurrings, db.recurringLogs, async () => {
      await db.recurrings.delete(id)
      await db.recurringLogs.where('recurringId').equals(id).delete()
    })
  },

  completeRecurring: (id, date) => {
    const log: RecurringLog = { id: recurringLogKey(id, date), recurringId: id, date }
    set((s) => ({ recurringLogs: [...s.recurringLogs.filter((l) => l.id !== log.id), log] }))
    get().updateRecurring(id, { lastDone: latestLog(get().recurringLogs, id) })
    void db.recurringLogs.put(log)
  },

  undoRecurring: (id, date) => {
    const key = recurringLogKey(id, date)
    set((s) => ({ recurringLogs: s.recurringLogs.filter((l) => l.id !== key) }))
    get().updateRecurring(id, { lastDone: latestLog(get().recurringLogs, id) })
    void db.recurringLogs.delete(key)
  },

  clearRecurringLogs: () => {
    set((s) => ({ recurringLogs: [], recurrings: s.recurrings.map((r) => ({ ...r, lastDone: null })) }))
    void db.transaction('rw', db.recurrings, db.recurringLogs, async () => {
      await db.recurringLogs.clear()
      await db.recurrings.toCollection().modify({ lastDone: null })
    })
  },

  exportJSON: () =>
    JSON.stringify(
      {
        version: 4,
        tasks: get().tasks,
        options: get().options,
        customColors: get().customColors,
        habits: get().habits,
        habitLogs: get().habitLogs,
        recurrings: get().recurrings,
        recurringLogs: get().recurringLogs,
      },
      null,
      2,
    ),

  importJSON: (json) => {
    const data = JSON.parse(json)
    if (!Array.isArray(data.tasks) || !Array.isArray(data.options)) throw new Error('Archivo inválido')
    let habits: Habit[] = Array.isArray(data.habits) ? data.habits : []
    let habitLogs: HabitLog[] = Array.isArray(data.habitLogs) ? data.habitLogs : []
    let recurrings: Recurring[] = Array.isArray(data.recurrings) ? data.recurrings : []
    let recurringLogs: RecurringLog[] = Array.isArray(data.recurringLogs) ? data.recurringLogs : []
    if (!(data.version >= 4)) {
      // Exportación anterior: los hábitos por intervalo (días/semanas/meses) pasan a recurrentes
      const m = migrateIntervalHabits(habits, habitLogs)
      habits = m.habits
      habitLogs = m.habitLogs
      recurrings = [...recurrings, ...m.recurrings]
      recurringLogs = [...recurringLogs, ...m.recurringLogs]
    }
    set({ tasks: data.tasks, options: data.options, customColors: Array.isArray(data.customColors) ? data.customColors : [], habits, habitLogs, recurrings, recurringLogs })
    persist()
    void db.transaction('rw', db.habits, db.habitLogs, db.recurrings, db.recurringLogs, async () => {
      await db.habits.clear()
      await db.habitLogs.clear()
      await db.recurrings.clear()
      await db.recurringLogs.clear()
      await db.habits.bulkPut(habits)
      await db.habitLogs.bulkPut(habitLogs)
      await db.recurrings.bulkPut(recurrings)
      await db.recurringLogs.bulkPut(recurringLogs)
    })
  },
}))
