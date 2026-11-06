import { useEffect, useState } from 'react'
import Board from './components/Board'
import Table from './components/Table'
import Settings from './components/Settings'
import { useStore } from './lib/store'
import { useTheme } from './lib/theme'

type Tab = 'week' | 'table' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('week')
  const [theme, setTheme] = useTheme()
  const ready = useStore((s) => s.ready)
  const load = useStore((s) => s.load)

  useEffect(() => {
    load()
  }, [load])

  if (!ready) return <div className="splash">Cargando pizarra…</div>

  return (
    <div className="app">
      <main className="main">
        {tab === 'week' && <Board />}
        {tab === 'table' && <Table />}
        {tab === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
      </main>
      <nav className="tabbar">
        {(
          [
            ['week', 'Semana', '▦'],
            ['table', 'Tabla', '☰'],
            ['settings', 'Ajustes', '⚙'],
          ] as const
        ).map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <span className="ico">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
