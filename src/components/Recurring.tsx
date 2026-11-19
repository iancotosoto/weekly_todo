import { useState } from 'react'
import { useStore } from '../lib/store'
import { todayStr } from '../lib/habits'
import { deadlineDates, describeRecurring, isDoneToday, stageLabel, status } from '../lib/recurring'
import type { Recurring as Rec } from '../lib/types'
import { recurringInk } from './RecurringCard'
import RecurringSheet from './RecurringSheet'

const fmt = (d: string) => d.split('-').reverse().join('/')

export default function Recurrings() {
  const { recurrings, recurringLogs, completeRecurring, undoRecurring } = useStore()
  const [sheet, setSheet] = useState<{ rec: Rec | null } | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const today = todayStr()
  const active = recurrings.filter((r) => !r.archived).sort((a, b) => status(a, today).dueDate.localeCompare(status(b, today).dueDate) || a.order - b.order)
  const archived = recurrings.filter((r) => r.archived)

  return (
    <div className="settings habits">
      <div className="habits-head">
        <h2>Recurrentes</h2>
        <button className="btn" onClick={() => setSheet({ rec: null })}>+ Nueva recurrente</button>
      </div>

      {!active.length && <p className="hint">Tareas que se repiten cada cierto tiempo, con hasta 3 plazos (ej. lavar el baño: 7, 10 y 14 días).</p>}

      {active.map((r) => {
        const st = status(r, today)
        const done = isDoneToday(r, today)
        const dates = deadlineDates(r)
        const total = recurringLogs.filter((l) => l.recurringId === r.id).length
        return (
          <div key={r.id} className="habit-row" style={{ ['--ink' as string]: recurringInk(r) }}>
            <div className="habit-top">
              <button className={'check' + (done ? ' on' : '')} onClick={() => (done ? undoRecurring(r.id, today) : completeRecurring(r.id, today))}>
                {done ? '✓' : ''}
              </button>
              <div className="card-text">
                <div className="card-name">{r.name}</div>
                <div className="card-meta">
                  <span className="proj-label">{describeRecurring(r)}</span>
                </div>
              </div>
              <button className="link" onClick={() => setSheet({ rec: r })}>Editar</button>
            </div>
            <div className="card-meta">
              <span className={'rec-badge' + (!done && st.overdue ? ' overdue' : '')}>
                {done ? 'Hecha hoy' : `${stageLabel(st)} · ${st.overdue ? 'pendiente desde ' + fmt(dates[dates.length - 1]) : fmt(st.dueDate)}`}
              </span>
              <span className="rec-badge">{dates.map(fmt).join(' → ')}</span>
              <span className="rec-badge">{r.lastDone ? `Última: ${fmt(r.lastDone)}` : 'Aún sin hacer'} · {total} veces</span>
            </div>
          </div>
        )
      })}

      {archived.length > 0 && (
        <>
          <button className="link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Ocultar' : 'Mostrar'} archivadas ({archived.length})
          </button>
          {showArchived && archived.map((r) => (
            <div key={r.id} className="up-row"><b>{r.name}</b><button className="link" onClick={() => setSheet({ rec: r })}>Editar</button></div>
          ))}
        </>
      )}

      {sheet && <RecurringSheet key={sheet.rec?.id ?? 'new'} rec={sheet.rec} onClose={() => setSheet(null)} />}
    </div>
  )
}
