import { useStore } from '../lib/store'
import { countOn } from '../lib/habits'
import type { Habit } from '../lib/types'

export const habitInk = (h: Habit) => h.color ?? 'var(--noink)'

// Tarjeta de hábito para un día concreto (no arrastrable)
export default function HabitCard({ habit, date, due, onOpen }: { habit: Habit; date: string; due: number; onOpen?: (h: Habit) => void }) {
  const logs = useStore((s) => s.habitLogs)
  const logHabit = useStore((s) => s.logHabit)
  const count = countOn(logs, habit.id, date)
  const done = count >= due
  return (
    <div className="card habit-card" style={{ ['--ink' as string]: habitInk(habit) }} onClick={() => onOpen?.(habit)}>
      <span className="card-strip" />
      <div className="card-main">
        <button
          className={'check' + (done ? ' on' : '')}
          aria-label={done ? 'Desmarcar hábito' : 'Marcar hábito'}
          onClick={(e) => {
            e.stopPropagation()
            logHabit(habit.id, date, done ? 0 : count + 1)
          }}
        >
          {done ? '✓' : due > 1 ? count : ''}
        </button>
        <div className="card-text">
          <div className={'card-name' + (done ? ' done' : '')}>{habit.name || 'Sin nombre'}</div>
          <div className="card-meta">
            <span className="proj-label">↻ Hábito</span>
            {due > 1 && <span className="when">{count}/{due}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
