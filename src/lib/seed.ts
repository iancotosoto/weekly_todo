import type { Option, Task } from './types'

export const DEFAULT_OPTIONS: Option[] = [
  { id: 'st-todo', kind: 'status', label: 'Por hacer', color: '#7b8087' },
  { id: 'st-doing', kind: 'status', label: 'En progreso', color: '#7b8087' },
  { id: 'st-done', kind: 'status', label: 'Hecho', color: '#7b8087' },
  { id: 'im-low', kind: 'importance', label: 'Baja', color: '#7b8087' },
  { id: 'im-mid', kind: 'importance', label: 'Media', color: '#7b8087' },
  { id: 'im-high', kind: 'importance', label: 'Alta', color: '#7b8087' },
]

export const SEED_TASKS: Task[] = []
