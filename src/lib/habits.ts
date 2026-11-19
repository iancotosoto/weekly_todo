import type { Habit, HabitLog } from './types'

const pad = (n: number) => String(n).padStart(2, '0')
export const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// Mediodía local: evita saltos por cambio de horario
export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
export const todayStr = () => fmtDate(new Date())
export const addDays = (s: string, n: number) => {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}
const diffDays = (a: string, b: string) => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 864e5)
const mondayOf = (s: string) => addDays(s, -((parseDate(s).getDay() + 6) % 7))
const lastDayOfMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate()
const monthsDiff = (a: Date, b: Date) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())

// Las 7 fechas (lunes a domingo) de la semana que contiene `ref`
export const weekDates = (ref: string) => {
  const mon = mondayOf(ref)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
}
export const monthRange = (ref: string): [string, string] => {
  const d = parseDate(ref)
  return [fmtDate(new Date(d.getFullYear(), d.getMonth(), 1)), fmtDate(new Date(d.getFullYear(), d.getMonth() + 1, 0))]
}
export const rangeDates = (from: string, to: string) => {
  const out: string[] = []
  for (let s = from; s <= to; s = addDays(s, 1)) out.push(s)
  return out
}

const matchesMonthDay = (days: number[], d: Date) => {
  const last = lastDayOfMonth(d.getFullYear(), d.getMonth())
  return days.some((x) => x === d.getDate() || (x > last && d.getDate() === last))
}

// Semana del mes en que cae la fecha: 1..4 = n-ésima ocurrencia de ese día; además 5 si es la última
export const monthWeekMatches = (weeks: number[], d: Date) => {
  const nth = Math.ceil(d.getDate() / 7)
  const isLast = d.getDate() + 7 > lastDayOfMonth(d.getFullYear(), d.getMonth())
  return weeks.some((w) => (w === 5 ? isLast : w === nth))
}

// Cuántas veces "toca" el hábito en la fecha dada (0 = no toca). Con horas fijas, cada hora es una vez.
export function dueOn(h: Habit, date: string): number {
  const base = baseDueOn(h, date)
  if (base === 0 || h.mode === 'interval') return base
  return Math.max(1, h.times?.length ?? 0)
}

function baseDueOn(h: Habit, date: string): number {
  if (h.archived || date < h.startDate) return 0
  const n = Math.max(1, Math.floor(h.every.n) || 1)
  const d = parseDate(date)
  const s = parseDate(h.startDate)
  const days = diffDays(h.startDate, date)
  switch (h.mode) {
    case 'daily':
      return days % n === 0 ? 1 : 0
    case 'weekly': {
      const wd = ((d.getDay() + 6) % 7) as number
      if (!h.weekdays.includes(wd as never)) return 0
      const weeks = Math.round(diffDays(mondayOf(h.startDate), mondayOf(date)) / 7)
      return weeks % n === 0 ? 1 : 0
    }
    case 'monthweek': {
      const wd = ((d.getDay() + 6) % 7) as number
      if (!h.weekdays.includes(wd as never) || !monthWeekMatches(h.monthWeeks ?? [], d)) return 0
      return monthsDiff(s, d) % n === 0 ? 1 : 0
    }
    case 'monthly':
      return matchesMonthDay(h.monthDays, d) && monthsDiff(s, d) % n === 0 ? 1 : 0
    case 'yearly': {
      const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      const leapFix = md === '02-28' && lastDayOfMonth(d.getFullYear(), 1) === 28 && h.yearDates.includes('02-29')
      if (!h.yearDates.includes(md) && !leapFix) return 0
      return (d.getFullYear() - s.getFullYear()) % n === 0 ? 1 : 0
    }
    case 'interval': {
      const { unit } = h.every
      if (unit === 'days') return days % n === 0 ? 1 : 0
      if (unit === 'weeks') return days % (7 * n) === 0 ? 1 : 0
      if (unit === 'months') {
        const anchor = s.getDate()
        const last = lastDayOfMonth(d.getFullYear(), d.getMonth())
        const hit = d.getDate() === Math.min(anchor, last)
        return hit && monthsDiff(s, d) % n === 0 ? 1 : 0
      }
      // horas: ocurrencias en [00:00, 24:00) a partir de startDate 00:00
      const step = n * 3600e3
      const t0 = new Date(h.startDate + 'T00:00:00').getTime()
      const a = new Date(date + 'T00:00:00').getTime()
      const b = a + 864e5
      const first = Math.max(0, Math.ceil((a - t0) / step))
      const last = Math.ceil((b - t0) / step) - 1
      return Math.max(0, last - first + 1)
    }
  }
}

export const logKey = (habitId: string, date: string) => `${habitId}_${date}`

export function countOn(logs: HabitLog[], habitId: string, date: string): number {
  return logs.find((l) => l.id === logKey(habitId, date))?.count ?? 0
}

export interface Progress {
  done: number // veces registradas
  scheduled: number // veces que tocaba
  goal: number | null
}

// El objetivo se calcula solo: las veces que tocaba en el rango según la repetición del hábito.
export function progress(h: Habit, logs: HabitLog[], from: string, to: string, _goal?: number | null): Progress {
  let done = 0
  for (const l of logs) if (l.habitId === h.id && l.date >= from && l.date <= to) done += l.count
  let scheduled = 0
  for (const d of rangeDates(from, to)) scheduled += dueOn(h, d)
  return { done, scheduled, goal: null }
}

export const timesOf = (h: Habit) => (h.mode === 'interval' ? [] : [...(h.times ?? [])].sort())

export function describe(h: Habit): string {
  const t = timesOf(h)
  return describeBase(h) + (t.length ? ` · ${t.join(', ')}` : '')
}

function describeBase(h: Habit): string {
  const { n, unit } = h.every
  const names = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
  const each = (sing: string, plur: string) => (n > 1 ? `cada ${n} ${plur}` : sing)
  switch (h.mode) {
    case 'daily':
      return each('Todos los días', 'días')
    case 'weekly':
      return `${each('Semanal', 'semanas')}: ${h.weekdays.map((w) => names[w]).join(', ') || '—'}`
    case 'monthweek': {
      const w = (h.monthWeeks ?? []).map((x) => (x === 5 ? 'última' : `${x}.ª`)).join(', ') || '—'
      return `${each('Mensual', 'meses')}: semana ${w} · ${h.weekdays.map((x) => names[x]).join(', ') || '—'}`
    }
    case 'monthly':
      return `${each('Mensual', 'meses')}: día ${h.monthDays.join(', ') || '—'}`
    case 'yearly':
      return `${each('Anual', 'años')}: ${h.yearDates.map((x) => x.split('-').reverse().join('/')).join(', ') || '—'}`
    case 'interval': {
      const u = { hours: 'horas', days: 'días', weeks: 'semanas', months: 'meses' }[unit]
      return `Cada ${n} ${u}`
    }
  }
}
