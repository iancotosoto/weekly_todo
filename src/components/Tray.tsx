import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import type { Option, Task } from '../lib/types'
import TaskCard from './TaskCard'

interface Props {
  tasks: Task[]
  options: Option[]
  open: boolean
  setOpen: (o: boolean) => void
  onOpen: (t: Task) => void
  onToggle: (id: string) => void
  onAdd: () => void
}

export default function Tray({ tasks, options, open, setOpen, onOpen, onToggle, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray' })
  return (
    <div ref={setNodeRef} className={'tray' + (open ? ' open' : '') + (isOver ? ' over' : '')}>
      <div className="tray-bar">
        <button className="tray-toggle" onClick={() => setOpen(!open)}>
          <span className="grip" />
          Sin día · {tasks.length} {open ? '▾' : '▴'}
        </button>
        <button className="tray-add" onClick={onAdd} aria-label="Añadir tarea sin día">+</button>
      </div>
      {open && (
        <div className="tray-list">
          <SortableContext items={tasks.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} options={options} onOpen={onOpen} onToggle={onToggle} compact />
            ))}
          </SortableContext>
          {!tasks.length && <div className="empty">Arrastra aquí tareas para quitarlas de un día</div>}
        </div>
      )}
    </div>
  )
}
