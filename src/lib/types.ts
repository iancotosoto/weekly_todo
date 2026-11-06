export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = lunes
export type Container = Weekday | null // null = bandeja "Sin día"

export const DAYS = [
  { short: 'LUN', letter: 'L', long: 'Lunes', color: '#d94b3d' },
  { short: 'MAR', letter: 'M', long: 'Martes', color: '#ee8a2b' },
  { short: 'MIÉ', letter: 'X', long: 'Miércoles', color: '#e9b824' },
  { short: 'JUE', letter: 'J', long: 'Jueves', color: '#3c9e5c' },
  { short: 'VIE', letter: 'V', long: 'Viernes', color: '#2f80d6' },
  { short: 'SÁB', letter: 'S', long: 'Sábado', color: '#8a55c4' },
  { short: 'DOM', letter: 'D', long: 'Domingo', color: '#7b8087' },
] as const

export interface Task {
  id: string
  name: string
  projectId: string | null
  date: string | null // yyyy-MM-dd
  time: string | null // HH:mm
  weekday: Weekday | null
  statusId: string | null
  importanceId: string | null
  order: number
  createdAt: number
}

export type OptionKind = 'project' | 'status' | 'importance'

export interface Option {
  id: string
  kind: OptionKind
  label: string
  color: string
}

export const DONE_ID = 'st-done'
export const TODO_ID = 'st-todo'
