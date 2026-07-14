import type { ExerciseProgress } from './dashboard.types'

const palette = ['#60a5fa', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']
const formatKilograms = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })

export function PrComparisonChart({ progresses }: { progresses: ExerciseProgress[] }) {
  const bars = progresses.slice(0, 6)
  const barMax = Math.max(...bars.map(({ bestRecord }) => bestRecord.weight), 1)

  return <article aria-label="PRs por ejercicio" className="visual-dashboard__bar-card"><div className="visual-dashboard__pr-heading"><div><h1>PRs</h1><p>Tu mejor marca por ejercicio.</p></div></div>{bars.length ? <div className="visual-dashboard__bars" role="list">{bars.map((progress, index) => { const weight = formatKilograms(progress.bestRecord.weight); return <div aria-label={`${progress.exercise.name}: ${weight} kilogramos`} className="visual-dashboard__bar" key={progress.exercise.id} role="listitem"><span>{progress.exercise.name}</span><i aria-hidden="true"><b style={{ width: `${Math.max((progress.bestRecord.weight / barMax) * 100, 8)}%`, backgroundColor: palette[index] }}/></i><strong>{weight}<small>kg</small></strong></div> })}</div> : <div className="visual-dashboard__bar-empty"><span aria-hidden="true">—</span><strong>Todavía no hay PRs</strong><small>Usá “Agregar” para registrar tu primera marca.</small></div>}</article>
}
