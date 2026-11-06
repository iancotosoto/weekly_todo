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

// El color de la tarjeta es el del proyecto; sin proyecto, gris neutro
export const inkOf = (task: Task, options: Option[]) =>
  options.find((o) => o.id === task.projectId)?.color ?? 'var(--noink)'

export function Dots({ task, options }: { task: Task; options: Option[] }) {
  const imps = options.filter((o) => o.kind === 'importance')
  const i = imps.findIndex((o) => o.id === task.importanceId)
  if (i < 0 || imps.length < 2) return null
  return (
    <span className="dots" title={imps[i].label} aria-label={'Importancia ' + imps[i].label}>
      {imps.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}
    </span>
  )
}

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
          {!compact && (proj || when || task.importanceId) && (
            <div className="card-meta">
              {proj && <span className="proj-label">{proj.label}</span>}
              {when && <span className={'when' + (isOverdue(task) ? ' late' : '')}>{when}</span>}
              <Dots task={task} options={options} />
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
