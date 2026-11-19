import { useState } from 'react'
import { useStore } from '../lib/store'
import { todayStr } from '../lib/habits'
import { DAYS, type EveryUnit, type Habit, type HabitMode, type Weekday } from '../lib/types'
import ColorPicker from './ColorPicker'

const MODES: [HabitMode, string][] = [
  ['daily', 'Diario'],
  ['weekly', 'Semanal'],
  ['monthly', 'Mensual'],
  ['yearly', 'Anual'],
  ['interval', 'Cada…'],
]
const UNITS: [EveryUnit, string][] = [
  ['hours', 'horas'],
  ['days', 'días'],
  ['weeks', 'semanas'],
  ['months', 'meses'],
]
const EVERY_NOUN: Record<HabitMode, string> = { daily: 'días', weekly: 'semanas', monthly: 'meses', yearly: 'años', interval: '' }

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
const numOrNull = (s: string) => (s === '' ? null : Math.max(0, Math.floor(Number(s)) || 0))

export default function HabitSheet({ habit, onClose }: { habit: Habit | null; onClose: () => void }) {
  const { addHabit, updateHabit, deleteHabit } = useStore()
  const isNew = !habit
  const [d, setD] = useState<Habit>(
    habit ?? {
      id: '', name: '', color: null, order: 0, createdAt: 0, archived: false, startDate: todayStr(),
      mode: 'daily', weekdays: [], monthDays: [], yearDates: [], every: { n: 1, unit: 'days' }, goalWeek: null, goalMonth: null,
    },
  )
  const [yd, setYd] = useState('')
  const set = (p: Partial<Habit>) => setD((x) => ({ ...x, ...p }))
  const setEvery = (p: Partial<Habit['every']>) => set({ every: { ...d.every, ...p } })

  const valid =
    d.name.trim() &&
    (d.mode === 'daily' || d.mode === 'interval' ||
      (d.mode === 'weekly' && d.weekdays.length) ||
      (d.mode === 'monthly' && d.monthDays.length) ||
      (d.mode === 'yearly' && d.yearDates.length))

  const save = () => {
    if (!valid) return
    const clean = { ...d, name: d.name.trim(), every: { ...d.every, n: Math.max(1, Math.floor(d.every.n) || 1) } }
    if (isNew) {
      const { id: _i, order: _o, createdAt: _c, ...rest } = clean
      addHabit(rest)
    } else updateHabit(d.id, clean)
    onClose()
  }

  const addYearDate = () => {
    if (!yd) return
    const md = yd.slice(5) // yyyy-MM-dd → MM-dd
    set({ yearDates: d.yearDates.includes(md) ? d.yearDates : [...d.yearDates, md].sort() })
    setYd('')
  }

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="link" onClick={onClose}>Cancelar</button>
          <strong>{isNew ? 'Nuevo hábito' : 'Editar hábito'}</strong>
          <button className="link strong" style={{ opacity: valid ? 1 : 0.4 }} onClick={save}>Guardar</button>
        </div>
        <div className="sheet-body">
          <input className="field big" placeholder="Nombre del hábito" value={d.name} autoFocus={isNew} onChange={(e) => set({ name: e.target.value })} />

          <label className="lbl">Se repite</label>
          <div className="chips">
            {MODES.map(([m, label]) => (
              <button key={m} className={'chip' + (d.mode === m ? ' on' : '')} onClick={() => set({ mode: m })}>{label}</button>
            ))}
          </div>

          {d.mode === 'weekly' && (
            <>
              <label className="lbl">Días de la semana</label>
              <div className="chips">
                {DAYS.map((x, i) => (
                  <button key={x.short} className={'chip' + (d.weekdays.includes(i as Weekday) ? ' on' : '')} onClick={() => set({ weekdays: toggle(d.weekdays, i as Weekday) })}>{x.short}</button>
                ))}
              </div>
            </>
          )}

          {d.mode === 'monthly' && (
            <>
              <label className="lbl">Días del mes</label>
              <div className="chips">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={'chip' + (d.monthDays.includes(n) ? ' on' : '')} onClick={() => set({ monthDays: toggle(d.monthDays, n).sort((a, b) => a - b) })}>{n}</button>
                ))}
              </div>
              <p className="hint">Si el mes no tiene ese día (29–31), cae en el último día.</p>
            </>
          )}

          {d.mode === 'yearly' && (
            <>
              <label className="lbl">Fechas del año</label>
              <div className="chips">
                {d.yearDates.map((md) => (
                  <button key={md} className="chip on" onClick={() => set({ yearDates: d.yearDates.filter((x) => x !== md) })}>
                    {md.split('-').reverse().join('/')} ×
                  </button>
                ))}
              </div>
              <div className="inline">
                <input className="field" type="date" value={yd} onChange={(e) => setYd(e.target.value)} />
                <button className="btn" onClick={addYearDate}>Añadir</button>
              </div>
            </>
          )}

          <label className="lbl">{d.mode === 'interval' ? 'Cada' : 'Repetir cada (1 = siempre)'}</label>
          <div className="inline">
            <input className="field" type="number" min={1} style={{ width: 80 }} value={d.every.n} onChange={(e) => setEvery({ n: Number(e.target.value) })} />
            {d.mode === 'interval' ? (
              <select className="field" value={d.every.unit} onChange={(e) => setEvery({ unit: e.target.value as EveryUnit })}>
                {UNITS.map(([u, l]) => <option key={u} value={u}>{l}</option>)}
              </select>
            ) : (
              <span>{EVERY_NOUN[d.mode]}</span>
            )}
          </div>

          <label className="lbl">Fecha de inicio</label>
          <input className="field" type="date" value={d.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />

          <label className="lbl">Objetivos (veces)</label>
          <div className="inline">
            <input className="field" type="number" min={0} placeholder="Por semana" value={d.goalWeek ?? ''} onChange={(e) => set({ goalWeek: numOrNull(e.target.value) })} />
            <input className="field" type="number" min={0} placeholder="Por mes" value={d.goalMonth ?? ''} onChange={(e) => set({ goalMonth: numOrNull(e.target.value) })} />
          </div>

          <label className="lbl">Color</label>
          <ColorPicker value={d.color ?? ''} onChange={(hex) => set({ color: hex })} />

          {!isNew && (
            <>
              <button className="btn" onClick={() => { updateHabit(d.id, { archived: !d.archived }); onClose() }}>
                {d.archived ? 'Reactivar hábito' : 'Archivar hábito'}
              </button>
              <button className="btn danger" onClick={() => { if (confirm('¿Eliminar este hábito y su registro?')) { deleteHabit(d.id); onClose() } }}>
                Eliminar hábito
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
