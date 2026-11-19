import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { forwardRef } from 'react'
import { DAYS, type Habit, type Option, type Recurring, type Task, type Weekday } from '../lib/types'
import TaskCard from './TaskCard'
import HabitCard from './HabitCard'
import RecurringCard from './RecurringCard'
import { todayStr } from '../lib/habits'

interface Props {
  day: Weekday
  tasks: Task[]
  habits: { habit: Habit; due: number }[]
  recurrings: Recurring[]
  date: string
  options: Option[]
  isToday: boolean
  onOpen: (t: Task) => void
  onToggle: (id: string) => void
  onAdd: (day: Weekday) => void
}

const DayColumn = forwardRef<HTMLElement, Props>(function DayColumn(
  { day, tasks, habits, recurrings, date, options, isToday, onOpen, onToggle, onAdd },
  ref,
) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` })
  const d = DAYS[day]
  return (
    <section ref={ref} className={'col' + (isToday ? ' today' : '')} data-day={day}>
      <header className="flag">
        <span className="flag-name">{d.short}</span>
        {isToday && <span className="flag-today">HOY</span>}
        <span className="flag-count">{tasks.length + habits.length + recurrings.length || ''}</span>
      </header>
      <div ref={setNodeRef} className={'lane' + (isOver ? ' over' : '')}>
        <div className="cord" />
        {habits.map(({ habit, due }) => (
          <HabitCard key={habit.id} habit={habit} date={date} due={due} />
        ))}
        {recurrings.map((r) => (
          <RecurringCard key={r.id} rec={r} today={todayStr()} />
        ))}
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
