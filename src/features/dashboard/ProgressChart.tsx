import { useMemo, useState } from 'react'
import type { ChartPoint, ExerciseProgress } from './dashboard.types'
import { getChartPoints } from './dashboard.service'

interface ProgressChartProps { progress: ExerciseProgress | null }
const formatWeight = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const formatDate = (date: string): string => new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

export function ProgressChart({ progress }: ProgressChartProps) {
  const points = useMemo(() => getChartPoints(progress), [progress])
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null)
  if (!progress || points.length < 2) return <div className="progress-chart__empty">Elegí un ejercicio con al menos dos registros para ver su evolución.</div>

  const width = 640
  const height = 232
  const padding = { top: 22, right: 20, bottom: 38, left: 44 }
  const weights = points.map((point) => point.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = Math.max(maxWeight - minWeight, 1)
  const x = (index: number) => padding.left + index * ((width - padding.left - padding.right) / Math.max(points.length - 1, 1))
  const y = (weight: number) => padding.top + (maxWeight - weight) * ((height - padding.top - padding.bottom) / range)
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.weight)}`).join(' ')
  const displayedPoint = activePoint ?? points[points.length - 1]

  return <div className="progress-chart"><div className="progress-chart__tooltip" role="status"><b>{formatWeight(displayedPoint.weight)} kg</b><span>{formatDate(displayedPoint.achievedAt)}</span></div><svg aria-label={`Evolución de ${progress.exercise.name}`} role="img" viewBox={`0 0 ${width} ${height}`}><line className="progress-chart__axis" x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} /><line className="progress-chart__axis" x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} /><text className="progress-chart__label" x="2" y={padding.top + 4}>{formatWeight(maxWeight)}</text><text className="progress-chart__label" x="2" y={height - padding.bottom}>{formatWeight(minWeight)}</text><path className="progress-chart__line" d={line} />{points.map((point, index) => <circle aria-label={`${formatWeight(point.weight)} kg el ${formatDate(point.achievedAt)}`} className="progress-chart__point" cx={x(index)} cy={y(point.weight)} key={point.id} onBlur={() => setActivePoint(null)} onClick={() => setActivePoint(point)} onFocus={() => setActivePoint(point)} r="5" role="button" tabIndex={0} />)}<text className="progress-chart__label progress-chart__label--date" x={padding.left} y={height - 12}>{formatDate(points[0].achievedAt)}</text><text className="progress-chart__label progress-chart__label--date" textAnchor="end" x={width - padding.right} y={height - 12}>{formatDate(points[points.length - 1].achievedAt)}</text></svg></div>
}
