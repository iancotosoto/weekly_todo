import { create } from 'zustand'
import { db } from './db'
import { DEFAULT_OPTIONS, SEED_TASKS } from './seed'
import { DONE_ID, TODO_ID, type Container, type Option, type OptionKind, type Task } from './types'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
import { BASIC_COLORS } from './colors'

interface State {
  ready: boolean
  tasks: Task[]
  options: Option[]
  customColors: string[]
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

  load: async () => {
    const [tasks, options, cc] = await Promise.all([db.tasks.toArray(), db.options.toArray(), db.meta.get('customColors')])
    const customColors = (cc?.value as string[] | undefined) ?? []
    if (!options.length && !tasks.length) {
      set({ tasks: SEED_TASKS, options: DEFAULT_OPTIONS, customColors, ready: true })
      persist()
    } else {
      set({ tasks, options, customColors, ready: true })
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

  exportJSON: () =>
    JSON.stringify({ version: 2, tasks: get().tasks, options: get().options, customColors: get().customColors }, null, 2),

  importJSON: (json) => {
    const data = JSON.parse(json)
    if (!Array.isArray(data.tasks) || !Array.isArray(data.options)) throw new Error('Archivo inválido')
    set({ tasks: data.tasks, options: data.options, customColors: Array.isArray(data.customColors) ? data.customColors : [] })
    persist()
  },
}))
