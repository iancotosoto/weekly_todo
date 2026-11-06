import { useState } from 'react'
import { useStore } from '../lib/store'
import { DAYS, type Task, type Weekday } from '../lib/types'

interface Props {
  task: Task
  isNew: boolean
  onClose: () => void
}

export default function TaskSheet({ task, isNew, onClose }: Props) {
  const { options, addTask, updateTask, deleteTask, addOption } = useStore()
  const [d, setD] = useState<Task>(task)
  const [newProject, setNewProject] = useState('')
  const set = (p: Partial<Task>) => setD((x) => ({ ...x, ...p }))

  const projects = options.filter((o) => o.kind === 'project')
  const statuses = options.filter((o) => o.kind === 'status')
  const imps = options.filter((o) => o.kind === 'importance')

  const save = () => {
    if (isNew) {
      const { id: _id, order: _o, createdAt: _c, ...rest } = d
      addTask({ ...rest, name: d.name.trim() })
    } else {
      updateTask(d.id, { ...d, name: d.name.trim() })
    }
    onClose()
  }

  const createProject = () => {
    const label = newProject.trim()
    if (!label) return
    const exist = projects.find((p) => p.label.toLowerCase() === label.toLowerCase())
    set({ projectId: (exist ?? addOption('project', label)).id })
    setNewProject('')
  }

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="link" onClick={onClose}>Cancelar</button>
          <strong>{isNew ? 'Nueva tarea' : 'Editar tarea'}</strong>
          <button className="link strong" onClick={save}>Guardar</button>
        </div>
        <div className="sheet-body">
          <input
            className="field big"
            placeholder="Nombre de la tarea"
            value={d.name}
            autoFocus={isNew}
            onChange={(e) => set({ name: e.target.value })}
          />

          <label className="lbl">Día de la semana</label>
          <div className="chips">
            <button className={'chip' + (d.weekday === null ? ' on' : '')} onClick={() => set({ weekday: null })}>
              Sin día
            </button>
            {DAYS.map((x, i) => (
              <button
                key={x.short}
                className={'chip day' + (d.weekday === i ? ' on' : '')}
                style={{ ['--c' as string]: x.color }}
                onClick={() => set({ weekday: i as Weekday })}
              >
                {x.short}
              </button>
            ))}
          </div>

          <label className="lbl">Proyecto</label>
          <div className="chips">
            <button className={'chip' + (d.projectId === null ? ' on' : '')} onClick={() => set({ projectId: null })}>
              Ninguno
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                className={'chip' + (d.projectId === p.id ? ' on' : '')}
                style={{ ['--c' as string]: p.color }}
                onClick={() => set({ projectId: p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="inline">
            <input
              className="field"
              placeholder="Nuevo proyecto…"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
            />
            <button className="btn" onClick={createProject} disabled={!newProject.trim()}>Crear</button>
          </div>

          <label className="lbl">Estado</label>
          <div className="chips">
            {statuses.map((p) => (
              <button
                key={p.id}
                className={'chip' + (d.statusId === p.id ? ' on' : '')}
                style={{ ['--c' as string]: p.color }}
                onClick={() => set({ statusId: p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="lbl">Importancia</label>
          <div className="chips">
            {imps.map((p) => (
              <button
                key={p.id}
                className={'chip' + (d.importanceId === p.id ? ' on' : '')}
                style={{ ['--c' as string]: p.color }}
                onClick={() => set({ importanceId: p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="lbl">Fecha y hora (opcionales)</label>
          <div className="inline">
            <input className="field" type="date" value={d.date ?? ''} onChange={(e) => set({ date: e.target.value || null })} />
            <input className="field" type="time" value={d.time ?? ''} onChange={(e) => set({ time: e.target.value || null })} />
          </div>

          {!isNew && (
            <button
              className="btn danger"
              onClick={() => {
                deleteTask(d.id)
                onClose()
              }}
            >
              Borrar tarea
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
