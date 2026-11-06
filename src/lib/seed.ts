import type { Option, Task } from './types'

export const DEFAULT_OPTIONS: Option[] = [
  { id: 'st-todo', kind: 'status', label: 'Por hacer', color: '#7b8087' },
  { id: 'st-doing', kind: 'status', label: 'En progreso', color: '#e08a14' },
  { id: 'st-done', kind: 'status', label: 'Hecho', color: '#22a06b' },
  { id: 'im-low', kind: 'importance', label: 'Baja', color: '#2f80d6' },
  { id: 'im-mid', kind: 'importance', label: 'Media', color: '#e9b824' },
  { id: 'im-high', kind: 'importance', label: 'Alta', color: '#d94b3d' },
  { id: 'pr-home', kind: 'project', label: 'Casa', color: '#3c9e5c' },
  { id: 'pr-work', kind: 'project', label: 'Trabajo', color: '#8a55c4' },
  { id: 'pr-study', kind: 'project', label: 'Estudio', color: '#d6448f' },
]

const t = (
  n: number,
  name: string,
  weekday: Task['weekday'],
  projectId: string | null,
  importanceId: string,
  extra: Partial<Task> = {},
): Task => ({
  id: `seed-${n}`,
  name,
  projectId,
  date: null,
  time: null,
  weekday,
  statusId: 'st-todo',
  importanceId,
  order: n,
  createdAt: Date.now() + n,
  ...extra,
})

export const SEED_TASKS: Task[] = [
  t(0, 'Reunión de equipo', 0, 'pr-work', 'im-high', { time: '09:30' }),
  t(1, 'Comprar víveres', 0, 'pr-home', 'im-low'),
  t(2, 'Entregar informe', 1, 'pr-work', 'im-high'),
  t(3, 'Leer capítulo 4', 1, 'pr-study', 'im-mid'),
  t(4, 'Sacar la basura', 2, 'pr-home', 'im-low'),
  t(5, 'Clase de inglés', 3, 'pr-study', 'im-mid', { time: '18:00' }),
  t(6, 'Llamar al dentista', null, null, 'im-mid'),
  t(7, 'Planear el fin de semana', null, 'pr-home', 'im-low'),
]
