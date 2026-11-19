import { useStore } from '../lib/store'
import { describeRecurring, isDoneToday, stageLabel, status } from '../lib/recurring'
import type { Recurring } from '../lib/types'

export const recurringInk = (r: Recurring) => r.color ?? 'var(--noink)'

// Tarjeta de recurrente en la pizarra (no arrastrable). Pasa de plazo en plazo hasta quedar vencida.
export default function RecurringCard({ rec, today, onOpen }: { rec: Recurring; today: string; onOpen?: (r: Recurring) => void }) {
  const complete = useStore((s) => s.completeRecurring)
  const undo = useStore((s) => s.undoRecurring)
  const done = isDoneToday(rec, today)
  const st = status(rec, today)
  return (
    <div className={'card habit-card rec-card' + (!done && st.overdue ? ' overdue' : '')} style={{ ['--ink' as string]: recurringInk(rec) }} onClick={() => onOpen?.(rec)}>
      <span className="card-strip" />
      <div className="card-main">
        <button
          className={'check' + (done ? ' on' : '')}
          aria-label={done ? 'Desmarcar recurrente' : 'Marcar recurrente'}
          onClick={(e) => {
            e.stopPropagation()
            if (done) undo(rec.id, today)
            else complete(rec.id, today)
          }}
        >
          {done ? '✓' : ''}
        </button>
        <div className="card-text">
          <div className={'card-name' + (done ? ' done' : '')}>{rec.name || 'Sin nombre'}</div>
          <div className="card-meta">
            <span className="proj-label">⟳ {done ? describeRecurring(rec) : stageLabel(st)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
