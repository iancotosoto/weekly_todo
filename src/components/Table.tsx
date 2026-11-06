import { useMemo, useState } from 'react'
import { formatWhen, isOverdue } from '../lib/format'
import { useStore } from '../lib/store'
import { DAYS, DONE_ID, type Option, type Task, type Weekday } from '../lib/types'
import TaskSheet from './TaskSheet'

type SortKey = 'name' | 'project' | 'date' | 'weekday' | 'status' | 'importance'
type GroupKey = 'none' | 'status' | 'project' | 'weekday' | 'importance'

const COLS: { key: SortKey; label: string; cls: string }[] = [
  { key: 'name', label: 'Tarea', cls: 'c-name' },
  { key: 'project', label: 'Proyecto', cls: 'c-proj' },
  { key: 'date', label: 'Fecha', cls: 'c-date' },
  { key: 'weekday', label: 'Día', cls: 'c-day' },
  { key: 'status', label: 'Estado', cls: 'c-stat' },
  { key: 'importance', label: 'Importancia', cls: 'c-imp' },
]

interface Group {
  id: string
  label: string
  color?: string
  tasks: Task[]
  preset: Partial<Task>
}

function Pill({ opt, colored }: { opt?: Option; colored?: boolean }) {
  if (!opt) return <span className="dash">—</span>
  return (
    <span className={'pill' + (colored ? '' : ' plain')} style={colored ? { ['--c' as string]: opt.color } : undefined}>
      {opt.label}
    </span>
  )
}

export default function Table() {
  const { tasks, options, toggleDone } = useStore()
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'weekday', dir: 1 })
  const [groupBy, setGroupBy] = useState<GroupKey>('status')
  const [fProject, setFProject] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sheet, setSheet] = useState<{ task: Task; isNew: boolean } | null>(null)

  const opt = (id: string | null) => options.find((o) => o.id === id)
  const of = (kind: Option['kind']) => options.filter((o) => o.kind === kind)
  const idx = (kind: Option['kind'], id: string | null) => (id ? of(kind).findIndex((o) => o.id === id) : -1)

  const visible = useMemo(() => {
    const val = (t: Task): string | number => {
      switch (sort.key) {
        case 'name': return t.name.toLowerCase()
        case 'project': return opt(t.projectId)?.label.toLowerCase() ?? ''
        case 'date': return t.date ? `${t.date} ${t.time ?? '99:99'}` : ''
        case 'weekday': return t.weekday ?? 99
        case 'status': return idx('status', t.statusId)
        case 'importance': return idx('importance', t.importanceId)
      }
    }
    return tasks
      .filter((t) => (!fProject || t.projectId === fProject) && (!fStatus || t.statusId === fStatus) && !(hideDone && t.statusId === DONE_ID))
      .sort((a, b) => {
        const va = val(a), vb = val(b)
        // vacíos siempre al final
        const ea = va === '' || va === -1 || va === 99, eb = vb === '' || vb === -1 || vb === 99
        if (ea !== eb) return ea ? 1 : -1
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir || a.order - b.order
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, options, sort, fProject, fStatus, hideDone])

  const groups: Group[] = useMemo(() => {
    if (groupBy === 'none') return [{ id: 'all', label: 'Todas las tareas', tasks: visible, preset: {} }]
    if (groupBy === 'weekday') {
      return [...DAYS.map((d, i) => ({ id: `d${i}`, label: d.long, color: undefined, preset: { weekday: i as Weekday } as Partial<Task>, tasks: visible.filter((t) => t.weekday === i) })),
        { id: 'd-none', label: 'Sin día', color: undefined, preset: { weekday: null } as Partial<Task>, tasks: visible.filter((t) => t.weekday === null) }]
    }
    const field = ({ status: 'statusId', project: 'projectId', importance: 'importanceId' } as const)[groupBy]
    const kind = groupBy
    return [
      ...of(kind).map((o) => ({ id: o.id, label: o.label, color: groupBy === 'project' ? o.color : undefined, preset: { [field]: o.id } as Partial<Task>, tasks: visible.filter((t) => t[field] === o.id) })),
      { id: 'g-none', label: 'Sin ' + (groupBy === 'status' ? 'estado' : groupBy === 'project' ? 'proyecto' : 'importancia'), color: undefined, preset: { [field]: null } as Partial<Task>, tasks: visible.filter((t) => t[field] === null) },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, groupBy, options])

  const openNew = (preset: Partial<Task>) =>
    setSheet({
      isNew: true,
      task: { id: '', name: '', projectId: null, date: null, time: null, weekday: null, statusId: 'st-todo', importanceId: 'im-mid', order: 0, createdAt: 0, ...preset },
    })

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }))
  const toggleGroup = (id: string) =>
    setCollapsed((c) => {
      const n = new Set(c)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  return (
    <div className="table-view">
      <div className="tbar">
        <label>
          Agrupar
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupKey)}>
            <option value="status">Estado</option>
            <option value="project">Proyecto</option>
            <option value="weekday">Día</option>
            <option value="importance">Importancia</option>
            <option value="none">Sin agrupar</option>
          </select>
        </label>
        <label>
          Proyecto
          <select value={fProject} onChange={(e) => setFProject(e.target.value)}>
            <option value="">Todos</option>
            {of('project').map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <label>
          Estado
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="">Todos</option>
            {of('status').map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <button className={'tog' + (hideDone ? ' on' : '')} onClick={() => setHideDone(!hideDone)}>
          Ocultar hechas
        </button>
      </div>

      <div className="tscroll">
        <div className="tgrid">
          <div className="trow thead">
            {COLS.map((c) => (
              <button key={c.key} className={'tcell ' + c.cls} onClick={() => toggleSort(c.key)}>
                {c.label}
                {sort.key === c.key && <b>{sort.dir === 1 ? ' ↑' : ' ↓'}</b>}
              </button>
            ))}
          </div>

          {groups.map((g) => {
            if (!g.tasks.length && groupBy !== 'none' && (g.id === 'g-none' || g.id === 'd-none')) return null
            const isCollapsed = collapsed.has(g.id)
            return (
              <div key={g.id} className="tgroup">
                <button className="ghead" onClick={() => toggleGroup(g.id)}>
                  <span className="caret">{isCollapsed ? '▸' : '▾'}</span>
                  {g.color && <i className="dot" style={{ background: g.color }} />}
                  {g.label}
                  <span className="gcount">{g.tasks.length}</span>
                </button>
                {!isCollapsed && (
                  <>
                    {g.tasks.map((t) => {
                      const done = t.statusId === DONE_ID
                      return (
                        <div key={t.id} className="trow" onClick={() => setSheet({ task: t, isNew: false })}>
                          <div className="tcell c-name">
                            <button
                              className={'check' + (done ? ' on' : '')}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDone(t.id)
                              }}
                            >
                              {done ? '✓' : ''}
                            </button>
                            <span className={'tname' + (done ? ' done' : '')}>{t.name || 'Sin nombre'}</span>
                          </div>
                          <div className="tcell c-proj"><Pill opt={opt(t.projectId)} colored /></div>
                          <div className={'tcell c-date' + (isOverdue(t) ? ' late' : '')}>{formatWhen(t) || <span className="dash">—</span>}</div>
                          <div className="tcell c-day">
                            {t.weekday !== null ? (
                              <span className="pill plain">{DAYS[t.weekday].long}</span>
                            ) : <span className="dash">—</span>}
                          </div>
                          <div className="tcell c-stat"><Pill opt={opt(t.statusId)} /></div>
                          <div className="tcell c-imp"><Pill opt={opt(t.importanceId)} /></div>
                        </div>
                      )
                    })}
                    <button className="trow tadd" onClick={() => openNew(g.preset)}>
                      <span className="tcell c-name">+ Añadir tarea…</span>
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {sheet && <TaskSheet key={sheet.task.id || 'new'} task={sheet.task} isNew={sheet.isNew} onClose={() => setSheet(null)} />}
    </div>
  )
}
