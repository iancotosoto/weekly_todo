import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { forwardRef } from 'react'
import { DAYS, type Option, type Task, type Weekday } from '../lib/types'
import TaskCard from './TaskCard'

interface Props {
  day: Weekday
  tasks: Task[]
  options: Option[]
  isToday: boolean
  onOpen: (t: Task) => void
  onToggle: (id: string) => void
  onAdd: (day: Weekday) => void
}

const DayColumn = forwardRef<HTMLElement, Props>(function DayColumn(
  { day, tasks, options, isToday, onOpen, onToggle, onAdd },
  ref,
) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` })
  const d = DAYS[day]
  return (
    <section ref={ref} className="col" data-day={day} style={{ ['--day' as string]: d.color }}>
      <header className="flag">
        <span className="flag-name">{d.short}</span>
        {isToday && <span className="flag-today">HOY</span>}
        <span className="flag-count">{tasks.length || ''}</span>
      </header>
      <div ref={setNodeRef} className={'lane' + (isOver ? ' over' : '')}>
        <div className="cord" />
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} options={options} onOpen={onOpen} onToggle={onToggle} />
          ))}
        </SortableContext>
        <button className="add" onClick={() => onAdd(day)}>
          + Añadir tarea
        </button>
      </div>
    </section>
  )
})

export default DayColumn
