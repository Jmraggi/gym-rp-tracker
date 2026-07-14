import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { CalculatorForm } from '../components/CalculatorForm'
import { PercentageSelector } from '../components/PercentageSelector'
import { ResultsList } from '../components/ResultsList'
import { AppHeader } from '../components/layout/AppHeader'
import { MobileGlassNavigation } from '../components/layout/MobileGlassNavigation'
import { PrivateNavigation } from '../components/layout/PrivateNavigation'
import { DEFAULT_PERCENTAGES } from '../constants/gym'
import { calculateProgressivePercentageResults, parseKilograms } from '../domain/calculator'
import type { BarWeight, Percentage, RoundingMethod } from '../domain/calculator.types'
import { AuthenticatedCalculatorSource } from '../features/calculator/components/AuthenticatedCalculatorSource'
import type { CalculatorSourceMode } from '../features/calculator/components/AuthenticatedCalculatorSource'
import { useQuickAddPersonalRecord } from '../features/personal-records/useQuickAddPersonalRecord'
import { supabase } from '../lib/supabase'

export function CalculatorPage() {
  const { user } = useAuth()
  const { openQuickAddPersonalRecord } = useQuickAddPersonalRecord()
  const [searchParams] = useSearchParams()
  const [rpInput, setRpInput] = useState('')
  const [barWeight, setBarWeight] = useState<BarWeight>(20)
  const [roundingMethod, setRoundingMethod] = useState<RoundingMethod>('nearest')
  const [sourceMode, setSourceMode] = useState<CalculatorSourceMode>(() => user ? 'saved' : 'manual')
  const [selectedPercentages, setSelectedPercentages] = useState<Percentage[]>(DEFAULT_PERCENTAGES)

  useEffect(() => {
    if (!user) { setSourceMode('manual'); setRpInput(''); return }
    let active = true
    setSourceMode('saved')
    void supabase.from('profiles').select('default_bar_weight, rounding_mode').eq('id', user.id).maybeSingle().then(({ data, error }) => {
      if (!active || error || !data) return
      if (data.default_bar_weight === 15 || data.default_bar_weight === 20) setBarWeight(data.default_bar_weight)
      if (data.rounding_mode === 'nearest' || data.rounding_mode === 'down') setRoundingMethod(data.rounding_mode)
    })
    return () => { active = false }
  }, [user])

  const validationMessage = useMemo(() => {
    const rp = parseKilograms(rpInput)
    if (rpInput.trim() === '') return user && sourceMode === 'saved' ? 'Seleccioná un ejercicio con un PR para calcular.' : 'Ingresá tu PR para ver los pesos de trabajo.'
    if (rp === null || rp <= 0) return 'Ingresá un PR válido mayor que cero.'
    if (rp < barWeight * 100) return `El PR debe ser igual o mayor que la barra de ${barWeight} kg.`
    return null
  }, [barWeight, rpInput, sourceMode, user])
  const results = useMemo(() => {
    const rp = parseKilograms(rpInput)
    if (rp === null || validationMessage !== null) return []
    return calculateProgressivePercentageResults(rp, selectedPercentages, barWeight, roundingMethod)
  }, [barWeight, roundingMethod, rpInput, selectedPercentages, validationMessage])
  const togglePercentage = (percentage: Percentage) => setSelectedPercentages((current) => current.includes(percentage) ? current.filter((item) => item !== percentage) : [...current, percentage].sort((a, b) => a - b))
  const showRpInput = !user || sourceMode === 'manual'

  return <><main className={`app-shell${user ? ' app-shell--private' : ''}`}><AppHeader />{user && <PrivateNavigation />}<header className="app-header"><p className="eyebrow">ENTRENAMIENTO · CARGA</p><h1>Armá tu próxima serie.</h1><p className="intro">Porcentajes reales, discos exactos por lado.</p></header>{user && <AuthenticatedCalculatorSource initialExerciseId={searchParams.get('exercise')} mode={sourceMode} onModeChange={setSourceMode} onWeightChange={setRpInput} />}<section aria-label="Calculadora de porcentajes" className="calculator-panel"><CalculatorForm barWeight={barWeight} onBarWeightChange={setBarWeight} onRpInputChange={setRpInput} onRoundingMethodChange={setRoundingMethod} roundingMethod={roundingMethod} rpInput={rpInput} showRpInput={showRpInput} /><PercentageSelector onToggle={togglePercentage} selectedPercentages={selectedPercentages} /></section><ResultsList message={validationMessage} results={results} showEmptySelection={validationMessage === null && selectedPercentages.length === 0} /></main>{user && <MobileGlassNavigation onAddPersonalRecord={() => openQuickAddPersonalRecord()} />}</>
}
