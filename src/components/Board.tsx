import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { todayIndex } from '../lib/format'
import { sortByOrder, useStore } from '../lib/store'
import { DAYS, type Container, type Task, type Weekday } from '../lib/types'
import DayColumn from './DayColumn'
import TaskSheet from './TaskSheet'
import { CardBody, inkOf } from './TaskCard'
import Tray from './Tray'

// Resuelve a qué contenedor (día o bandeja) y a qué tarea apunta un id de dnd-kit
function resolve(id: string | number, tasks: Task[]): { container: Container; taskId?: string } | null {
  const s = String(id)
  if (s === 'tray') return { container: null }
  if (s.startsWith('day-') || s.startsWith('strip-')) return { container: Number(s.split('-')[1]) as Weekday }
  const t = tasks.find((x) => x.id === s)
  return t ? { container: t.weekday, taskId: t.id } : null
}

const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const found = hits.length ? hits : rectIntersection(args)
  // preferir tarjetas sobre contenedores
  const cards = found.filter((c) => !/^(day|strip)-|^tray$/.test(String(c.id)))
  return cards.length ? cards : found
}

function StripChip({ day, active, today, count, onClick }: { day: Weekday; active: boolean; today: boolean; count: number; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `strip-${day}` })
  return (
    <button
      ref={setNodeRef}
      className={'strip-chip' + (active ? ' active' : '') + (isOver ? ' over' : '') + (today ? ' today' : '')}
      onClick={onClick}
    >
      <span>{DAYS[day].letter}</span>
      {count > 0 && <i>{count}</i>}
    </button>
  )
}

export default function Board() {
  const { tasks, options, moveTask, toggleDone } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<{ task: Task; isNew: boolean } | null>(null)
  const [trayOpen, setTrayOpen] = useState(true)
  const [current, setCurrent] = useState<number>(todayIndex())
  const scroller = useRef<HTMLDivElement>(null)
  const cols = useRef<(HTMLElement | null)[]>([])
  const today = todayIndex()

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )

  const byContainer = useMemo(() => {
    const m = new Map<Container, Task[]>()
    for (const c of [null, 0, 1, 2, 3, 4, 5, 6] as Container[]) m.set(c, [])
    for (const t of [...tasks].sort(sortByOrder)) m.get(t.weekday)!.push(t)
    return m
  }, [tasks])

  const scrollToDay = (i: number, smooth = true) => {
    const el = cols.current[i]
    const sc = scroller.current
    if (el && sc) sc.scrollTo({ left: el.offsetLeft - sc.offsetLeft - 12, behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    scrollToDay(todayIndex(), false)
  }, [])

  const onScroll = () => {
    const sc = scroller.current
    if (!sc) return
    const x = sc.scrollLeft + sc.clientWidth / 3
    let idx = 0
    cols.current.forEach((el, i) => {
      if (el && el.offsetLeft - sc.offsetLeft <= x) idx = i
    })
    setCurrent(idx)
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const cur = tasks.find((t) => t.id === active.id)
    const r = resolve(over.id, tasks)
    if (!cur || !r || r.container === cur.weekday) return
    const list = byContainer.get(r.container) ?? []
    const idx = r.taskId ? list.findIndex((t) => t.id === r.taskId) : list.length
    moveTask(cur.id, r.container, idx < 0 ? list.length : idx)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const cur = tasks.find((t) => t.id === active.id)
    const r = resolve(over.id, tasks)
    if (!cur || !r || !r.taskId || r.taskId === cur.id || r.container !== cur.weekday) return
    const list = byContainer.get(r.container) ?? []
    moveTask(cur.id, r.container, list.findIndex((t) => t.id === r.taskId))
  }

  const openNew = (weekday: Container) =>
    setSheet({ isNew: true, task: { id: '', name: '', projectId: null, date: null, time: null, weekday, statusId: 'st-todo', importanceId: 'im-mid', order: 0, createdAt: 0 } })

  return (
    <div className={'board' + (activeId ? ' dragging' : '')}>
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        autoScroll={{ threshold: { x: 0.18, y: 0.15 }, acceleration: 14 }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="strip">
          {DAYS.map((_, i) => (
            <StripChip
              key={i}
              day={i as Weekday}
              active={current === i}
              today={today === i}
              count={byContainer.get(i as Weekday)!.length}
              onClick={() => scrollToDay(i)}
            />
          ))}
        </div>

        <div className="frame">
          <div className="scroller" ref={scroller} onScroll={onScroll}>
            {DAYS.map((_, i) => (
              <DayColumn
                key={i}
                ref={(el) => {
                  cols.current[i] = el
                }}
                day={i as Weekday}
                tasks={byContainer.get(i as Weekday)!}
                options={options}
                isToday={today === i}
                onOpen={(t) => setSheet({ task: t, isNew: false })}
                onToggle={toggleDone}
                onAdd={openNew}
              />
            ))}
          </div>
        </div>

        <Tray
          tasks={byContainer.get(null)!}
          options={options}
          open={trayOpen}
          setOpen={setTrayOpen}
          onOpen={(t) => setSheet({ task: t, isNew: false })}
          onToggle={toggleDone}
          onAdd={() => openNew(null)}
        />

        <DragOverlay dropAnimation={{ duration: 180 }}>
          {activeTask && (
            <div className="card lifted" style={{ ['--ink' as string]: inkOf(activeTask, options) }}>
              <CardBody task={activeTask} options={options} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {sheet && <TaskSheet key={sheet.task.id || 'new'} task={sheet.task} isNew={sheet.isNew} onClose={() => setSheet(null)} />}
    </div>
  )
}
