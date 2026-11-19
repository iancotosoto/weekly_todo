import { useState } from 'react'
import { useStore } from '../lib/store'
import { todayStr } from '../lib/habits'
import { DAYS, type Habit, type HabitMode, type Weekday } from '../lib/types'
import ColorPicker from './ColorPicker'

const MODES: [HabitMode, string][] = [
  ['daily', 'Diario'],
  ['weekly', 'Semanal'],
  ['monthly', 'Mensual (días)'],
  ['monthweek', 'Mensual (semanas)'],
  ['yearly', 'Anual'],
  ['interval', 'Cada X horas'],
]
const EVERY_NOUN: Record<HabitMode, string> = { daily: 'días', weekly: 'semanas', monthly: 'meses', yearly: 'años', interval: 'horas', monthweek: 'meses' }

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export default function HabitSheet({ habit, onClose }: { habit: Habit | null; onClose: () => void }) {
  const { addHabit, updateHabit, deleteHabit } = useStore()
  const isNew = !habit
  const [d, setD] = useState<Habit>(
    habit ?? {
      id: '', name: '', color: null, order: 0, createdAt: 0, archived: false, startDate: todayStr(),
      mode: 'daily', weekdays: [], monthWeeks: [], times: [], monthDays: [], yearDates: [], every: { n: 1, unit: 'days' }, goalWeek: null, goalMonth: null,
    },
  )
  const [yd, setYd] = useState('')
  const [tm, setTm] = useState('')
  const set = (p: Partial<Habit>) => setD((x) => ({ ...x, ...p }))
  const setEvery = (p: Partial<Habit['every']>) => set({ every: { ...d.every, ...p } })

  const valid =
    d.name.trim() &&
    (d.mode === 'daily' || d.mode === 'interval' ||
      ((d.mode === 'weekly') && d.weekdays.length) ||
      (d.mode === 'monthweek' && d.weekdays.length && d.monthWeeks?.length) ||
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

  const addTime = () => {
    if (!tm) return
    set({ times: (d.times ?? []).includes(tm) ? d.times : [...(d.times ?? []), tm].sort() })
    setTm('')
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
              <button key={m} className={'chip' + (d.mode === m ? ' on' : '')} onClick={() => set(m === 'interval' ? { mode: m, every: { n: Math.min(d.every.n, 24), unit: 'hours' } } : { mode: m, every: { ...d.every, unit: 'days' } })}>{label}</button>
            ))}
          </div>

          {(d.mode === 'weekly' || d.mode === 'monthweek') && (
            <>
              <label className="lbl">Días de la semana</label>
              <div className="chips">
                {DAYS.map((x, i) => (
                  <button key={x.short} className={'chip' + (d.weekdays.includes(i as Weekday) ? ' on' : '')} onClick={() => set({ weekdays: toggle(d.weekdays, i as Weekday) })}>{x.short}</button>
                ))}
              </div>
            </>
          )}

          {d.mode === 'monthweek' && (
            <>
              <label className="lbl">Semanas del mes</label>
              <div className="chips">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className={'chip' + (d.monthWeeks?.includes(n) ? ' on' : '')} onClick={() => set({ monthWeeks: toggle(d.monthWeeks ?? [], n).sort((a, b) => a - b) })}>
                    {n === 5 ? 'Última' : `${n}.ª`}
                  </button>
                ))}
              </div>
              <p className="hint">«1.ª» es la primera vez que cae ese día en el mes (ej. primer lunes); «Última» es la última vez.</p>
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

          {d.mode !== 'interval' && (
            <>
              <label className="lbl">Horas fijas (opcional)</label>
              <div className="chips">
                {(d.times ?? []).map((t) => (
                  <button key={t} className="chip on" onClick={() => set({ times: (d.times ?? []).filter((x) => x !== t) })}>{t} ×</button>
                ))}
              </div>
              <div className="inline">
                <input className="field" type="time" value={tm} onChange={(e) => setTm(e.target.value)} />
                <button className="btn" onClick={addTime}>Añadir</button>
              </div>
              <p className="hint">Cada hora cuenta como una vez ese día (ej. 08:00 y 20:00 = 2 veces).</p>
            </>
          )}

          <label className="lbl">{d.mode === 'interval' ? 'Cada (veces por día)' : 'Repetir cada (1 = siempre)'}</label>
          <div className="inline">
            <input className="field" type="number" min={1} style={{ width: 80 }} value={d.every.n} onChange={(e) => setEvery({ n: Number(e.target.value) })} />
            <span>{EVERY_NOUN[d.mode]}</span>
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
