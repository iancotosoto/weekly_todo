import type { Task } from './types'

// "HH:mm dd/mm/aaaa" con hora y fecha opcionales
export function formatWhen(t: Pick<Task, 'date' | 'time'>): string {
  const date = t.date ? t.date.split('-').reverse().join('/') : ''
  return [t.time ?? '', date].filter(Boolean).join(' ')
}

export const todayIndex = () => (new Date().getDay() + 6) % 7

export function isOverdue(t: Pick<Task, 'date' | 'statusId'>): boolean {
  if (!t.date || t.statusId === 'st-done') return false
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return t.date < today
}
