import { useStore } from '../lib/store'
import { describeRecurring, isDoneToday, stageLabel, status } from '../lib/recurring'
import type { Recurring } from '../lib/types'

export const recurringInk = (r: Recurring) => r.color ?? 'var(--noink)'

// Tarjeta de recurrente en la pizarra (no arrastrable). Pasa de plazo en plazo hasta quedar vencida.
export default function RecurringCard({ rec, today, date, onOpen }: { rec: Recurring; today: string; date?: string; onOpen?: (r: Recurring) => void }) {
  const complete = useStore((s) => s.completeRecurring)
  const undo = useStore((s) => s.undoRecurring)
  // Una ocurrencia futura nunca está hecha: lo hecho hoy corresponde a la anterior
  const day = date ?? today
  const done = isDoneToday(rec, today) && day === today
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
            // En un día futuro se marca esa ocurrencia (marcar "hoy" no hace nada si ya se hizo hoy)
            else complete(rec.id, day)
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
