import { addDays, fmtDate, parseDate } from './habits'
import type { Deadline, EveryUnit, Habit, HabitLog, Recurring, RecurringLog } from './types'

export const MAX_DEADLINES = 3
export const recurringLogKey = (id: string, date: string) => `${id}_${date}`

const addMonths = (s: string, n: number) => {
  const d = parseDate(s)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
  return fmtDate(d)
}

export function addDeadline(base: string, dl: Deadline): string {
  const n = Math.max(1, Math.floor(dl.n) || 1)
  switch (dl.unit) {
    case 'hours':
      return addDays(base, Math.floor(n / 24))
    case 'days':
      return addDays(base, n)
    case 'weeks':
      return addDays(base, 7 * n)
    case 'months':
      return addMonths(base, n)
  }
}

// Aproximación en horas, solo para comparar que los plazos sean crecientes
const HOURS: Record<EveryUnit, number> = { hours: 1, days: 24, weeks: 168, months: 720 }
export const approxHours = (d: Deadline) => d.n * HOURS[d.unit]

export function validDeadlines(ds: Deadline[]): boolean {
  if (ds.length < 1 || ds.length > MAX_DEADLINES) return false
  if (ds.some((d) => !(d.n >= 1) || !Number.isInteger(d.n))) return false
  return ds.every((d, i) => i === 0 || approxHours(d) > approxHours(ds[i - 1]))
}

// Fechas de cada plazo, contadas desde la última vez que se hizo (o la fecha de inicio)
export function deadlineDates(r: Recurring): string[] {
  const base = r.lastDone ?? r.startDate
  return r.deadlines.map((d) => addDeadline(base, d))
}

export interface RecurringStatus {
  stage: number // índice del plazo vigente (0 = ideal)
  dueDate: string // fecha en la que toca (hoy si está vencida)
  overdue: boolean // pasó el último plazo
}

// El plazo vigente es el primero que aún no se ha pasado; si se pasaron todos, queda vencida en `today`.
export function status(r: Recurring, today: string): RecurringStatus {
  const dates = deadlineDates(r)
  const i = dates.findIndex((d) => today <= d)
  if (i === -1) return { stage: dates.length - 1, dueDate: today, overdue: true }
  return { stage: i, dueDate: dates[i], overdue: false }
}

export const isDoneToday = (r: Recurring, today: string) => r.lastDone === today

const UNIT: Record<EveryUnit, [string, string]> = {
  hours: ['hora', 'horas'],
  days: ['día', 'días'],
  weeks: ['semana', 'semanas'],
  months: ['mes', 'meses'],
}

export const deadlineLabel = (d: Deadline) => `${d.n} ${UNIT[d.unit][d.n === 1 ? 0 : 1]}`

export function describeRecurring(r: Recurring): string {
  return 'Cada ' + r.deadlines.map(deadlineLabel).join(' → ')
}

export const STAGE_LABELS = ['Ideal', '2.º plazo', 'Plazo definitivo']
export const stageLabel = (s: RecurringStatus) => (s.overdue ? 'Vencida' : STAGE_LABELS[s.stage] ?? 'Plazo')

export const latestLog = (logs: RecurringLog[], id: string) =>
  logs.filter((l) => l.recurringId === id).reduce<string | null>((m, l) => (m === null || l.date > m ? l.date : m), null)

// Los hábitos "interval" en días/semanas/meses pasan a ser recurrentes; el de horas sigue siendo hábito.
export function migrateIntervalHabits(habits: Habit[], logs: HabitLog[]) {
  const moved = habits.filter((h) => h.mode === 'interval' && h.every.unit !== 'hours')
  const ids = new Set(moved.map((h) => h.id))
  const recurringLogs: RecurringLog[] = logs
    .filter((l) => ids.has(l.habitId) && l.count > 0)
    .map((l) => ({ id: recurringLogKey(l.habitId, l.date), recurringId: l.habitId, date: l.date }))
  const recurrings: Recurring[] = moved.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    order: h.order,
    createdAt: h.createdAt,
    archived: h.archived,
    startDate: h.startDate,
    deadlines: [{ n: h.every.n, unit: h.every.unit }],
    lastDone: latestLog(recurringLogs, h.id),
  }))
  return {
    habits: habits.filter((h) => !ids.has(h.id)),
    habitLogs: logs.filter((l) => !ids.has(l.habitId)),
    recurrings,
    recurringLogs,
  }
}
