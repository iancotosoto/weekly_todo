import { useState } from 'react'
import { useStore } from '../lib/store'
import { todayStr } from '../lib/habits'
import { MAX_DEADLINES, STAGE_LABELS, validDeadlines } from '../lib/recurring'
import type { Deadline, EveryUnit, Recurring } from '../lib/types'
import ColorPicker from './ColorPicker'

const UNITS: [EveryUnit, string][] = [
  ['hours', 'horas'],
  ['days', 'días'],
  ['weeks', 'semanas'],
  ['months', 'meses'],
]

export default function RecurringSheet({ rec, onClose }: { rec: Recurring | null; onClose: () => void }) {
  const { addRecurring, updateRecurring, deleteRecurring } = useStore()
  const isNew = !rec
  const [d, setD] = useState<Recurring>(
    rec ?? { id: '', name: '', color: null, order: 0, createdAt: 0, archived: false, startDate: todayStr(), deadlines: [{ n: 7, unit: 'days' }], lastDone: null },
  )
  const set = (p: Partial<Recurring>) => setD((x) => ({ ...x, ...p }))
  const setDl = (i: number, p: Partial<Deadline>) => set({ deadlines: d.deadlines.map((x, j) => (j === i ? { ...x, ...p } : x)) })

  const increasing = validDeadlines(d.deadlines)
  const valid = d.name.trim() && increasing

  const save = () => {
    if (!valid) return
    const clean = { ...d, name: d.name.trim() }
    if (isNew) {
      const { id: _i, order: _o, createdAt: _c, ...rest } = clean
      addRecurring(rest)
    } else updateRecurring(d.id, clean)
    onClose()
  }

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="link" onClick={onClose}>Cancelar</button>
          <strong>{isNew ? 'Nueva recurrente' : 'Editar recurrente'}</strong>
          <button className="link strong" style={{ opacity: valid ? 1 : 0.4 }} onClick={save}>Guardar</button>
        </div>
        <div className="sheet-body">
          <input className="field big" placeholder="Nombre (ej. Lavar el baño)" value={d.name} autoFocus={isNew} onChange={(e) => set({ name: e.target.value })} />

          <label className="lbl">Plazos desde la última vez que se hizo</label>
          {d.deadlines.map((dl, i) => (
            <div key={i} className="dl-row">
              <span className="tag">{STAGE_LABELS[i]}</span>
              <input className="field" type="number" min={1} style={{ width: 80 }} value={dl.n} onChange={(e) => setDl(i, { n: Math.floor(Number(e.target.value)) })} />
              <select className="field" value={dl.unit} onChange={(e) => setDl(i, { unit: e.target.value as EveryUnit })}>
                {UNITS.map(([u, l]) => <option key={u} value={u}>{l}</option>)}
              </select>
              {d.deadlines.length > 1 && <button className="link" onClick={() => set({ deadlines: d.deadlines.filter((_, j) => j !== i) })}>×</button>}
            </div>
          ))}
          {d.deadlines.length < MAX_DEADLINES && (
            <button
              className="btn"
              onClick={() => {
                const last = d.deadlines[d.deadlines.length - 1]
                set({ deadlines: [...d.deadlines, { n: last.n + Math.max(1, Math.round(last.n / 2)), unit: last.unit }] })
              }}
            >
              + Añadir plazo
            </button>
          )}
          <p className="hint">
            {increasing ? 'Si no se hace en el plazo ideal pasa al siguiente; tras el último queda vencida.' : 'Cada plazo debe ser mayor que el anterior.'}
          </p>

          <label className="lbl">{d.lastDone ? 'Última vez' : 'Fecha de inicio (cuenta desde aquí la primera vez)'}</label>
          {d.lastDone ? (
            <input className="field" type="date" value={d.lastDone} onChange={(e) => e.target.value && set({ lastDone: e.target.value })} />
          ) : (
            <input className="field" type="date" value={d.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
          )}

          <label className="lbl">Color</label>
          <ColorPicker value={d.color ?? ''} onChange={(hex) => set({ color: hex })} />

          {!isNew && (
            <>
              <button className="btn" onClick={() => { updateRecurring(d.id, { archived: !d.archived }); onClose() }}>
                {d.archived ? 'Reactivar' : 'Archivar'}
              </button>
              <button className="btn danger" onClick={() => { if (confirm('¿Eliminar esta recurrente y su registro?')) { deleteRecurring(d.id); onClose() } }}>
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
