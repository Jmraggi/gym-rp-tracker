import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Exercise } from '../../exercises/exercises.types'
import { formatProgressDate, formatProgressWeight, parseLocalCalendarDate } from '../progress.metrics'
import type { ExerciseProgressMetrics } from '../progress.types'

interface ExerciseProgressChartProps { exercise: Exercise; metrics: ExerciseProgressMetrics }
const WIDTH = 720
const HEIGHT = 310
const PADDING = { top: 34, right: 26, bottom: 50, left: 58 }

export function ExerciseProgressChart({ exercise, metrics }: ExerciseProgressChartProps) {
  const points = metrics.timeline
  const currentPrIndex = Math.max(points.findIndex((entry) => entry.isCurrentPr), 0)
  const [rovingIndex, setRovingIndex] = useState(currentPrIndex)
  const [activeIndex, setActiveIndex] = useState(currentPrIndex)
  const pointRefs = useRef<Array<SVGGElement | null>>([])
  const descriptionId = `progress-chart-description-${exercise.id}`

  useEffect(() => { setRovingIndex(currentPrIndex); setActiveIndex(currentPrIndex) }, [currentPrIndex, exercise.id])

  const geometry = useMemo(() => {
    if (!points.length) return null
    const times = points.map((entry) => parseLocalCalendarDate(entry.record.achievedAt)?.getTime() ?? 0)
    const weights = points.map((entry) => entry.record.weight)
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const weightRange = maxWeight - minWeight
    const weightPadding = weightRange === 0 ? Math.max(maxWeight * .08, 2.5) : Math.max(weightRange * .12, 1)
    const yMin = Math.max(0, minWeight - weightPadding)
    const yMax = maxWeight + weightPadding
    const x = (time: number) => PADDING.left + (time - minTime) * ((WIDTH - PADDING.left - PADDING.right) / Math.max(maxTime - minTime, 1))
    const y = (weight: number) => PADDING.top + (yMax - weight) * ((HEIGHT - PADDING.top - PADDING.bottom) / Math.max(yMax - yMin, 1))
    const coordinates = points.map((entry, index) => ({ entry, x: x(times[index]), y: y(entry.record.weight) }))
    const yTicks = Array.from({ length: 4 }, (_, index) => yMin + (yMax - yMin) * (index / 3))
    const tickIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]
    return { coordinates, line: coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '), tickIndexes, y, yTicks }
  }, [points])

  if (!points.length || !geometry) return <section aria-label={`Evolución de ${exercise.name}`} className="progress-chart-card progress-chart-card--empty"><div className="progress-section-heading"><div><p className="eyebrow">EVOLUCIÓN</p><h2>Gráfico histórico</h2></div></div><p>No hay registros válidos para graficar.</p></section>

  const activeEntry = points[Math.min(activeIndex, points.length - 1)]
  const improvementCount = points.filter((entry) => entry.milestone === 'improvement').length
  const focusPoint = (nextIndex: number) => { setRovingIndex(nextIndex); requestAnimationFrame(() => pointRefs.current[nextIndex]?.focus()) }
  const activatePoint = (index: number) => { setRovingIndex(index); setActiveIndex(index) }
  const onPointKeyDown = (event: ReactKeyboardEvent<SVGGElement>, index: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = Math.min(index + 1, points.length - 1)
    if (event.key === 'ArrowLeft') nextIndex = Math.max(index - 1, 0)
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = points.length - 1
    if (nextIndex !== null) { event.preventDefault(); focusPoint(nextIndex); return }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activatePoint(index) }
  }
  const pointStatus = (index: number) => {
    const entry = points[index]
    const milestone = entry.milestone === 'initial' ? 'PR inicial' : entry.milestone === 'improvement' ? 'nuevo PR' : 'registro'
    return entry.isCurrentPr ? `${milestone}, PR actual` : milestone
  }

  return <section aria-labelledby="progress-chart-title" className="progress-chart-card"><div className="progress-section-heading"><div><p className="eyebrow">EVOLUCIÓN</p><h2 id="progress-chart-title">Gráfico histórico</h2></div><span>{points.length} {points.length === 1 ? 'punto' : 'puntos'}</span></div><p className="sr-only" id={descriptionId}>{exercise.name} comenzó en {formatProgressWeight(points[0].record.weight)} kilogramos y tiene un PR actual de {formatProgressWeight(metrics.currentPr?.weight ?? Number.NaN)} kilogramos, con {improvementCount} {improvementCount === 1 ? 'mejora real' : 'mejoras reales'}. El historial posterior contiene la alternativa textual completa.</p><div className="progress-chart__detail" role="status"><div><strong>{formatProgressWeight(activeEntry.record.weight)} kg</strong><time dateTime={activeEntry.record.achievedAt}>{formatProgressDate(activeEntry.record.achievedAt)}</time></div><span>{pointStatus(activeIndex)}</span>{activeEntry.record.notes && <p>{activeEntry.record.notes}</p>}</div><svg aria-describedby={descriptionId} aria-label={`Evolución histórica de ${exercise.name}`} className="progress-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
    {geometry.yTicks.map((tick) => <g key={tick}><line className="progress-chart__grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={geometry.y(tick)} y2={geometry.y(tick)}/><text className="progress-chart__axis-label" textAnchor="end" x={PADDING.left - 10} y={geometry.y(tick) + 4}>{formatProgressWeight(tick)}</text></g>)}
    <path className="progress-chart__line" d={geometry.line}/>
    {geometry.tickIndexes.map((index) => <text className="progress-chart__axis-label progress-chart__axis-label--date" key={points[index].record.id} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} x={geometry.coordinates[index].x} y={HEIGHT - 14}>{formatProgressDate(points[index].record.achievedAt, { day: '2-digit', month: 'short' })}</text>)}
    {geometry.coordinates.map(({ entry, x, y }, index) => <g aria-label={`${exercise.name}, ${formatProgressDate(entry.record.achievedAt)}, ${formatProgressWeight(entry.record.weight)} kilogramos, ${pointStatus(index)}`} className={`progress-chart__point is-${entry.milestone}${entry.isCurrentPr ? ' is-current' : ''}`} key={entry.record.id} onClick={() => activatePoint(index)} onKeyDown={(event) => onPointKeyDown(event, index)} onPointerEnter={() => activatePoint(index)} ref={(node) => { pointRefs.current[index] = node }} role="button" tabIndex={index === rovingIndex ? 0 : -1}>
      {entry.isCurrentPr && <circle className="progress-chart__current-ring" cx={x} cy={y} r="11"/>}{entry.milestone === 'improvement' ? <path d={`M ${x} ${y - 6} L ${x + 6} ${y} L ${x} ${y + 6} L ${x - 6} ${y} Z`}/> : entry.milestone === 'initial' ? <rect height="12" width="12" x={x - 6} y={y - 6}/> : <circle cx={x} cy={y} r="5"/>}
    </g>)}
  </svg><div aria-hidden="true" className="progress-chart__legend"><span><i className="is-initial"/>PR inicial</span><span><i className="is-improvement"/>Nuevo PR</span><span><i className="is-current"/>PR actual</span></div></section>
}
