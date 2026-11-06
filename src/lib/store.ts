import { create } from 'zustand'
import { db } from './db'
import { DEFAULT_OPTIONS, SEED_TASKS } from './seed'
import { DONE_ID, TODO_ID, type Container, type Option, type OptionKind, type Task } from './types'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
const PALETTE = ['#d94b3d', '#ee8a2b', '#e9b824', '#3c9e5c', '#2f80d6', '#8a55c4', '#d6448f', '#1ba3a3']

interface State {
  ready: boolean
  tasks: Task[]
  options: Option[]
  load: () => Promise<void>
  addTask: (p: Partial<Task>) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleDone: (id: string) => void
  moveTask: (id: string, container: Container, index: number) => void
  addOption: (kind: OptionKind, label: string) => Option
  exportJSON: () => string
  importJSON: (json: string) => void
}

let timer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const { tasks, options } = useStore.getState()
    await db.transaction('rw', db.tasks, db.options, async () => {
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

  load: async () => {
    const [tasks, options] = await Promise.all([db.tasks.toArray(), db.options.toArray()])
    if (!options.length && !tasks.length) {
      set({ tasks: SEED_TASKS, options: DEFAULT_OPTIONS, ready: true })
      persist()
    } else {
      set({ tasks, options, ready: true })
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
    const used = get().options.filter((o) => o.kind === kind).length
    const opt: Option = { id: uid(), kind, label: label.trim(), color: PALETTE[used % PALETTE.length] }
    set((s) => ({ options: [...s.options, opt] }))
    persist()
    return opt
  },

  exportJSON: () => JSON.stringify({ version: 1, tasks: get().tasks, options: get().options }, null, 2),

  importJSON: (json) => {
    const data = JSON.parse(json)
    if (!Array.isArray(data.tasks) || !Array.isArray(data.options)) throw new Error('Archivo inválido')
    set({ tasks: data.tasks, options: data.options })
    persist()
  },
}))
