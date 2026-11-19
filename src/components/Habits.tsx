import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { addDays, countOn, describe, dueOn, monthRange, progress, todayStr, weekDates, type Progress } from '../lib/habits'
import { DAYS, type Habit } from '../lib/types'
import { habitInk } from './HabitCard'
import HabitSheet from './HabitSheet'

function Bar({ label, p }: { label: string; p: Progress }) {
  const target = p.goal ?? p.scheduled
  const pct = target > 0 ? Math.min(100, Math.round((p.done / target) * 100)) : 0
  return (
    <div className="hbar">
      <span>{label}</span>
      <div className="hbar-track"><i style={{ width: pct + '%' }} /></div>
      <b>{p.done}/{target}</b>
    </div>
  )
}

// Semanas/meses anteriores (registro histórico)
function History({ h }: { h: Habit }) {
  const logs = useStore((s) => s.habitLogs)
  const [mode, setMode] = useState<'week' | 'month'>('week')
  const rows = useMemo(() => {
    const out: { label: string; p: Progress }[] = []
    const today = todayStr()
    for (let i = 0; i < 6; i++) {
      if (mode === 'week') {
        const w = weekDates(addDays(today, -7 * i))
        out.push({ label: w[0].slice(5).split('-').reverse().join('/'), p: progress(h, logs, w[0], w[6], h.goalWeek) })
      } else {
        const d = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - i)
        const [a, b] = monthRange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
        out.push({ label: a.slice(0, 7), p: progress(h, logs, a, b, h.goalMonth) })
      }
    }
    return out
  }, [h, logs, mode])
  return (
    <div className="hhist">
      <div className="seg">
        <button className={mode === 'week' ? 'on' : ''} onClick={() => setMode('week')}>Semanas</button>
        <button className={mode === 'month' ? 'on' : ''} onClick={() => setMode('month')}>Meses</button>
      </div>
      {rows.map((r) => <Bar key={r.label} label={r.label} p={r.p} />)}
    </div>
  )
}

export default function Habits() {
  const { habits, habitLogs, logHabit } = useStore()
  const [sheet, setSheet] = useState<{ habit: Habit | null } | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const today = todayStr()
  const week = weekDates(today)
  const [m0, m1] = monthRange(today)

  const active = habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order)
  const archived = habits.filter((h) => h.archived)

  const upcoming = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => addDays(today, i + 1))
        .map((date) => ({ date, items: active.filter((h) => dueOn(h, date) > 0) }))
        .filter((x) => x.items.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits, today],
  )

  const label = (date: string) => {
    const wd = (new Date(date + 'T12:00:00').getDay() + 6) % 7
    return `${DAYS[wd].short} ${date.slice(8)}/${date.slice(5, 7)}`
  }

  return (
    <div className="settings habits">
      <div className="habits-head">
        <h2>Hábitos</h2>
        <button className="btn" onClick={() => setSheet({ habit: null })}>+ Nuevo hábito</button>
      </div>

      {!active.length && <p className="hint">Aún no hay hábitos. Crea uno para verlo en la semana y en la tabla.</p>}

      {active.map((h) => {
        const due = dueOn(h, today)
        const count = countOn(habitLogs, h.id, today)
        const done = due > 0 && count >= due
        const wk = progress(h, habitLogs, week[0], week[6], h.goalWeek)
        const mo = progress(h, habitLogs, m0, m1, h.goalMonth)
        return (
          <div key={h.id} className="habit-row" style={{ ['--ink' as string]: habitInk(h) }}>
            <div className="habit-top">
              {due > 0 ? (
                <button className={'check' + (done ? ' on' : '')} onClick={() => logHabit(h.id, today, done ? 0 : count + 1)}>
                  {done ? '✓' : due > 1 ? count : ''}
                </button>
              ) : (
                <span className="check off" title="Hoy no toca" />
              )}
              <div className="card-text" onClick={() => setOpen(open === h.id ? null : h.id)}>
                <div className="card-name">{h.name}</div>
                <div className="card-meta"><span className="proj-label">{describe(h)}</span>{due > 1 && <span className="when">{count}/{due} hoy</span>}</div>
              </div>
              <button className="link" onClick={() => setSheet({ habit: h })}>Editar</button>
            </div>
            <Bar label="Semana" p={wk} />
            <Bar label="Mes" p={mo} />
            {open === h.id && <History h={h} />}
          </div>
        )
      })}

      {upcoming.length > 0 && (
        <>
          <h3>Próximos días</h3>
          {upcoming.map((u) => (
            <div key={u.date} className="up-row">
              <b>{label(u.date)}</b>
              <span>{u.items.map((h) => h.name).join(' · ')}</span>
            </div>
          ))}
        </>
      )}

      {archived.length > 0 && (
        <>
          <button className="link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Ocultar' : 'Mostrar'} archivados ({archived.length})
          </button>
          {showArchived && archived.map((h) => (
            <div key={h.id} className="up-row"><b>{h.name}</b><button className="link" onClick={() => setSheet({ habit: h })}>Editar</button></div>
          ))}
        </>
      )}

      {sheet && <HabitSheet key={sheet.habit?.id ?? 'new'} habit={sheet.habit} onClose={() => setSheet(null)} />}
    </div>
  )
}
