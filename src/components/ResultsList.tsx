import type { PercentageResult } from '../domain/calculator.types'
import { formatDifference, formatWeight } from '../domain/formatters'
import { PlateBreakdown } from './PlateBreakdown'

interface ResultsListProps {
  results: PercentageResult[]
  message: string | null
  showEmptySelection: boolean
}

export function ResultsList({ results, message, showEmptySelection }: ResultsListProps) {
  if (message !== null) {
    const isError = message.includes('válido') || message.startsWith('El PR')
    return <section className="results"><p className={`state-message${isError ? ' is-error' : ''}`}>{message}</p></section>
  }
  if (showEmptySelection) return <section className="results"><p className="state-message">Seleccioná al menos un porcentaje para armar tu serie.</p></section>

  return <section className="results" aria-live="polite">
    <div className="results-heading"><h2>Pesos armables</h2><span>Incluyen barra</span></div>
    <div className="result-list">
      {results.map((result) => <article className="result-card" key={result.percentage}>
        <div className="result-top">
          <span className="percentage-badge">{result.percentage}%</span>
          <div className="weight-summary"><span>Armable</span><strong>{formatWeight(result.loadableWeight)}<small> kg</small></strong></div>
        </div>
        <div className="result-details">
          <div className="detail"><span>Teórico</span><strong>{formatWeight(result.theoreticalWeight)} kg</strong></div>
          <div className="detail"><span>Diferencia</span><strong>{formatDifference(result.difference)} kg</strong></div>
        </div>
        <PlateBreakdown plates={result.platesPerSide} />
      </article>)}
    </div>
  </section>
}
