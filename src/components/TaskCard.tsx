import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatWhen, isOverdue } from '../lib/format'
import { DONE_ID, type Option, type Task } from '../lib/types'

interface Props {
  task: Task
  options: Option[]
  onOpen: (t: Task) => void
  onToggle: (id: string) => void
  compact?: boolean
}

export const inkOf = (task: Task, options: Option[]) =>
  options.find((o) => o.id === task.importanceId)?.color ?? 'var(--line)'

export function CardBody({ task, options, onToggle, compact }: Omit<Props, 'onOpen' | 'onToggle'> & { onToggle?: (id: string) => void }) {
  const proj = options.find((o) => o.id === task.projectId)
  const done = task.statusId === DONE_ID
  const when = formatWhen(task)
  return (
    <>
      <span className="card-strip" />
      <div className="card-main">
        <button
          className={'check' + (done ? ' on' : '')}
          aria-label={done ? 'Marcar pendiente' : 'Marcar hecha'}
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.(task.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {done ? '✓' : ''}
        </button>
        <div className="card-text">
          <div className={'card-name' + (done ? ' done' : '')}>{task.name || 'Sin nombre'}</div>
          {!compact && (proj || when) && (
            <div className="card-meta">
              {proj && (
                <span className="pill" style={{ ['--c' as string]: proj.color }}>
                  {proj.label}
                </span>
              )}
              {when && <span className={'when' + (isOverdue(task) ? ' late' : '')}>{when}</span>}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function TaskCard({ task, options, onOpen, onToggle, compact }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      className={'card' + (isDragging ? ' ghost' : '') + (compact ? ' compact' : '')}
      style={{ transform: CSS.Transform.toString(transform), transition, ['--ink' as string]: inkOf(task, options) }}
      onClick={() => onOpen(task)}
      {...attributes}
      {...listeners}
    >
      <CardBody task={task} options={options} onToggle={onToggle} compact={compact} />
    </div>
  )
}
