import { useRef, useState } from 'react'
import { useStore } from '../lib/store'
import ColorPicker from './ColorPicker'
import type { ThemePref } from '../lib/theme'

export default function Settings({ theme, setTheme }: { theme: ThemePref; setTheme: (t: ThemePref) => void }) {
  const exportJSON = useStore((s) => s.exportJSON)
  const importJSON = useStore((s) => s.importJSON)
  const options = useStore((s) => s.options)
  const setOptionColor = useStore((s) => s.setOptionColor)
  const deleteProject = useStore((s) => s.deleteProject)
  const clearTasks = useStore((s) => s.clearTasks)
  const [editing, setEditing] = useState<string | null>(null)
  const projects = options.filter((o) => o.kind === 'project')
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pizarra-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const doImport = async (f?: File) => {
    if (!f) return
    try {
      importJSON(await f.text())
      setMsg('Respaldo importado.')
    } catch {
      setMsg('No se pudo leer el archivo.')
    }
  }

  return (
    <div className="settings">
      <h2>Ajustes</h2>
      <section>
        <h3>Apariencia</h3>
        <div className="seg">
          {(
            [
              ['auto', 'Auto'],
              ['light', 'Pizarra blanca'],
              ['dark', 'Pizarra negra'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} className={theme === id ? 'on' : ''} onClick={() => setTheme(id)}>
              {label}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Proyectos y colores</h3>
        {!projects.length && <p className="hint">Aún no hay proyectos. Créalos al editar una tarea.</p>}
        {projects.map((p) => (
          <div key={p.id} className="proj-row">
            <button className="proj-head" onClick={() => setEditing(editing === p.id ? null : p.id)}>
              <i className="dot big" style={{ background: p.color }} />
              <span>{p.label}</span>
              <span className="caret">{editing === p.id ? '▾' : '▸'}</span>
            </button>
            {editing === p.id && (
              <>
                <ColorPicker value={p.color} onChange={(hex) => setOptionColor(p.id, hex)} />
                <button
                  className="btn danger"
                  onClick={() => {
                    if (confirm(`¿Borrar el proyecto "${p.label}"? Sus tareas se quedan sin proyecto.`)) deleteProject(p.id)
                  }}
                >
                  Borrar proyecto
                </button>
              </>
            )}
          </div>
        ))}
      </section>
      <section>
        <h3>Respaldo</h3>
        <p className="hint">Tus datos viven solo en este dispositivo. Guarda un respaldo en Archivos/iCloud de vez en cuando.</p>
        <div className="row">
          <button className="btn" onClick={doExport}>Exportar JSON</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Importar JSON</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
        {msg && <p className="hint">{msg}</p>}
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('¿Borrar TODAS las tareas? Esto no se puede deshacer. Exporta un respaldo antes si lo necesitas.')) clearTasks()
          }}
        >
          Borrar todas las tareas
        </button>
      </section>
    </div>
  )
}
