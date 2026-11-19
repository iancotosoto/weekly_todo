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

// ---- Hábitos ----
export type HabitMode = 'daily' | 'weekly' | 'monthweek' | 'monthly' | 'yearly' | 'interval'
export type EveryUnit = 'hours' | 'days' | 'weeks' | 'months'

export interface Habit {
  id: string
  name: string
  color: string | null
  order: number
  createdAt: number
  archived: boolean
  startDate: string // yyyy-MM-dd, ancla de los intervalos
  mode: HabitMode
  weekdays: Weekday[] // weekly y monthweek
  monthWeeks?: number[] // monthweek: 1..4 = n-ésima ocurrencia del día en el mes, 5 = la última
  times?: string[] // horas fijas HH:mm en los días que toca (cada una cuenta como una vez)
  monthDays: number[] // monthly (1..31; los días que no existen caen en el último día del mes)
  yearDates: string[] // yearly, 'MM-dd'
  // daily/weekly/monthly/yearly: "cada N días/semanas/meses/años" (n=1 = siempre).
  // interval: regla completa (cada N horas/días/semanas/meses).
  every: { n: number; unit: EveryUnit }
  goalWeek: number | null
  goalMonth: number | null
}

export interface HabitLog {
  id: string // `${habitId}_${date}`
  habitId: string
  date: string // yyyy-MM-dd
  count: number
}

// ---- Recurrentes ----
// Tareas "cada X tiempo" con hasta 3 plazos (ideal, segundo, definitivo) contados desde la última vez que se hicieron.
export interface Deadline {
  n: number
  unit: EveryUnit
}

export interface Recurring {
  id: string
  name: string
  color: string | null
  order: number
  createdAt: number
  archived: boolean
  startDate: string // yyyy-MM-dd, ancla mientras nunca se ha hecho
  deadlines: Deadline[] // 1..3, crecientes
  lastDone: string | null // yyyy-MM-dd de la última vez que se hizo
}

export interface RecurringLog {
  id: string // `${recurringId}_${date}`
  recurringId: string
  date: string // yyyy-MM-dd
}
