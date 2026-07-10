import type { PlateDistribution } from '../domain/calculator.types'
import { formatWeight } from '../domain/formatters'

interface PlateBreakdownProps { plates: PlateDistribution[] }

export function PlateBreakdown({ plates }: PlateBreakdownProps) {
  return <div className="plate-breakdown">
    <h3>Por lado</h3>
    {plates.length === 0 ? <p className="bar-only">Solo barra</p> : <ul className="plate-list">
      {plates.map(({ plateWeight, count }) => <li className="plate" key={plateWeight}><span className="plate-count">{count}×</span>{formatWeight(plateWeight * 100)}</li>)}
    </ul>}
  </div>
}
