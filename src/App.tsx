import { useMemo, useState } from 'react'
import { CalculatorForm } from './components/CalculatorForm'
import { PercentageSelector } from './components/PercentageSelector'
import { ResultsList } from './components/ResultsList'
import { DEFAULT_PERCENTAGES } from './constants/gym'
import { calculatePercentageResult, parseKilograms } from './domain/calculator'
import type { BarWeight, Percentage, RoundingMethod } from './domain/calculator.types'
import './App.css'

function App() {
  const [rpInput, setRpInput] = useState('')
  const [barWeight, setBarWeight] = useState<BarWeight>(20)
  const [roundingMethod, setRoundingMethod] = useState<RoundingMethod>('nearest')
  const [selectedPercentages, setSelectedPercentages] = useState<Percentage[]>(DEFAULT_PERCENTAGES)
  const validationMessage = useMemo(() => {
    const rp = parseKilograms(rpInput)
    if (rpInput.trim() === '') return 'Ingresá tu RP para ver los pesos de trabajo.'
    if (rp === null || rp <= 0) return 'Ingresá un RP válido mayor que cero.'
    if (rp < barWeight * 100) return `El RP debe ser igual o mayor que la barra de ${barWeight} kg.`
    return null
  }, [barWeight, rpInput])
  const results = useMemo(() => {
    const rp = parseKilograms(rpInput)
    if (rp === null || validationMessage !== null) return []
    return selectedPercentages.map((percentage) => calculatePercentageResult(rp, percentage, barWeight, roundingMethod))
  }, [barWeight, roundingMethod, rpInput, selectedPercentages, validationMessage])
  const togglePercentage = (percentage: Percentage) => {
    setSelectedPercentages((current) => current.includes(percentage) ? current.filter((item) => item !== percentage) : [...current, percentage].sort((a, b) => a - b))
  }
  return <main className="app-shell"><header className="app-header"><p className="eyebrow">ENTRENAMIENTO · CARGA</p><h1>Armá tu próxima serie.</h1><p className="intro">Porcentajes reales, discos exactos por lado.</p></header><section className="calculator-panel" aria-label="Calculadora de porcentajes"><CalculatorForm barWeight={barWeight} onBarWeightChange={setBarWeight} onRpInputChange={setRpInput} onRoundingMethodChange={setRoundingMethod} roundingMethod={roundingMethod} rpInput={rpInput} /><PercentageSelector onToggle={togglePercentage} selectedPercentages={selectedPercentages} /></section><ResultsList message={validationMessage} results={results} showEmptySelection={validationMessage === null && selectedPercentages.length === 0} /></main>
}
export default App
