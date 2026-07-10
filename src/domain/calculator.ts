import { DEFAULT_PLATE_INVENTORY } from '../constants/gym'
import type { BarWeight, Percentage, PercentageResult, PlateCombinationScore, PlateDistribution, PlateInventoryItem, PlateTransitionCost, RoundingMethod } from './calculator.types'

const CENTI_KILOS = 100
const MAX_UNLIMITED_SEARCH_STEPS = 1000

interface PlateOption { weight: number; weightInCentiKilos: number; maxPerSide: number | null }

export const parseKilograms = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.')
  if (normalized === '' || !/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null
  const kilograms = Number(normalized)
  return Number.isFinite(kilograms) ? Math.round(kilograms * CENTI_KILOS) : null
}

export const calculateTheoreticalWeight = (rp: number, percentage: Percentage): number => Math.round((rp * percentage) / 100)

const getPlateOptions = (inventory: readonly PlateInventoryItem[]): PlateOption[] => inventory
  .filter((item) => item.totalQuantity === null || item.totalQuantity > 0)
  .map((item) => ({ weight: item.weight, weightInCentiKilos: Math.round(item.weight * CENTI_KILOS), maxPerSide: item.totalQuantity === null ? null : Math.floor(item.totalQuantity / 2) }))
  .filter((item) => item.maxPerSide === null || item.maxPerSide > 0)
  .sort((a, b) => b.weightInCentiKilos - a.weightInCentiKilos)

const countDiscs = (combination: readonly PlateDistribution[]): number => combination.reduce((total, item) => total + item.count, 0)

const compareHigherPlates = (candidate: readonly PlateDistribution[], current: readonly PlateDistribution[]): boolean => {
  const candidateCounts = new Map(candidate.map((item) => [item.plateWeight, item.count]))
  const currentCounts = new Map(current.map((item) => [item.plateWeight, item.count]))
  const weights = [...new Set([...candidateCounts.keys(), ...currentCounts.keys()])].sort((a, b) => b - a)
  for (const weight of weights) {
    const candidateCount = candidateCounts.get(weight) ?? 0
    const currentCount = currentCounts.get(weight) ?? 0
    if (candidateCount !== currentCount) return candidateCount > currentCount
  }
  return false
}

export const generateValidPlateCombinations = (loadableWeight: number, barWeight: BarWeight, inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PlateDistribution[][] => {
  const plateWeightTotal = loadableWeight - barWeight * CENTI_KILOS
  if (plateWeightTotal < 0 || plateWeightTotal % 2 !== 0) return []
  const requiredPerSide = plateWeightTotal / 2
  const options = getPlateOptions(inventory)
  const combinations: PlateDistribution[][] = []
  const search = (index: number, remaining: number, current: PlateDistribution[]) => {
    if (remaining === 0) { combinations.push(current); return }
    if (index === options.length || remaining < 0) return
    const option = options[index]
    const limit = Math.min(option.maxPerSide ?? Math.floor(remaining / option.weightInCentiKilos), Math.floor(remaining / option.weightInCentiKilos))
    for (let count = 0; count <= limit; count += 1) {
      const next = count > 0 ? [...current, { plateWeight: option.weight as PlateDistribution['plateWeight'], count }] : current
      search(index + 1, remaining - count * option.weightInCentiKilos, next)
    }
  }
  search(0, requiredPerSide, [])
  return combinations
}

export const normalizePlateCombination = (combination: readonly PlateDistribution[], inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PlateDistribution[] => {
  const options = getPlateOptions(inventory)
  const counts = new Map<PlateDistribution['plateWeight'], number>(combination.map((item) => [item.plateWeight, item.count]))
  const ascending = [...options].sort((a, b) => a.weightInCentiKilos - b.weightInCentiKilos)
  for (const option of ascending) {
    const currentCount = counts.get(option.weight as PlateDistribution['plateWeight']) ?? 0
    const target = options.find((candidate) => candidate.weightInCentiKilos === option.weightInCentiKilos * 2)
    if (!target || currentCount < 2) continue
    const targetWeight = target.weight as PlateDistribution['plateWeight']
    const targetCount = counts.get(targetWeight) ?? 0
    const capacity = target.maxPerSide === null ? Number.POSITIVE_INFINITY : target.maxPerSide - targetCount
    const replacements = Math.min(Math.floor(currentCount / 2), capacity)
    if (replacements <= 0) continue
    counts.set(option.weight as PlateDistribution['plateWeight'], currentCount - replacements * 2)
    counts.set(targetWeight, targetCount + replacements)
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([weightA], [weightB]) => weightB - weightA)
    .map(([plateWeight, count]) => ({ plateWeight, count }))
}

const combinationKey = (combination: readonly PlateDistribution[]): string => combination.map((item) => `${item.plateWeight}:${item.count}`).join('|')

const getNormalizedCandidates = (loadableWeight: number, barWeight: BarWeight, inventory: readonly PlateInventoryItem[]): PlateDistribution[][] => {
  const unique = new Map<string, PlateDistribution[]>()
  generateValidPlateCombinations(loadableWeight, barWeight, inventory).forEach((candidate) => {
    const normalized = normalizePlateCombination(candidate, inventory)
    unique.set(combinationKey(normalized), normalized)
  })
  return [...unique.values()]
}

export const calculateTransitionCost = (previous: readonly PlateDistribution[], next: readonly PlateDistribution[]): PlateTransitionCost => {
  const previousCounts = new Map(previous.map((item) => [item.plateWeight, item.count]))
  const nextCounts = new Map(next.map((item) => [item.plateWeight, item.count]))
  const weights = new Set([...previousCounts.keys(), ...nextCounts.keys()])
  let removedCount = 0
  let addedCount = 0
  let preservedCount = 0
  let preservedWeight = 0
  weights.forEach((weight) => {
    const before = previousCounts.get(weight) ?? 0
    const after = nextCounts.get(weight) ?? 0
    const preserved = Math.min(before, after)
    removedCount += Math.max(before - after, 0)
    addedCount += Math.max(after - before, 0)
    preservedCount += preserved
    preservedWeight += preserved * Math.round(weight * CENTI_KILOS)
  })
  return { removedCount, addedCount, totalOperations: removedCount + addedCount, preservedCount, preservedWeight }
}

export const scorePlateCombination = (previous: readonly PlateDistribution[], candidate: readonly PlateDistribution[], inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PlateCombinationScore => {
  const normalized = normalizePlateCombination(candidate, inventory)
  const transition = calculateTransitionCost(previous, normalized)
  const countOf = (weight: PlateDistribution['plateWeight']): number => normalized.find((item) => item.plateWeight === weight)?.count ?? 0
  const smallPlatePenalty = Math.max(countOf(1.25) - 1, 0) * 4 + Math.max(countOf(2.5) - 1, 0) * 3
  const mediumPlatePenalty = Math.max(countOf(5) - 1, 0) * 2 + Math.max(countOf(10) - 1, 0) * 2
  const preservedLargeWeight = previous.reduce((total, item) => item.plateWeight >= 5 ? total + Math.min(item.count, countOf(item.plateWeight)) * Math.round(item.plateWeight * CENTI_KILOS) : total, 0)
  const simplificationBonus = countDiscs(candidate) - countDiscs(normalized)
  const finalScore = countDiscs(normalized) * 100 + smallPlatePenalty * 10 + mediumPlatePenalty * 8 + transition.totalOperations - simplificationBonus * 5
  return { totalPlateCount: countDiscs(normalized), smallPlatePenalty, mediumPlatePenalty, preservedLargeWeight, removedCount: transition.removedCount, addedCount: transition.addedCount, totalOperations: transition.totalOperations, simplificationBonus, finalScore }
}

const isBetterPracticalCombination = (previous: readonly PlateDistribution[], candidate: readonly PlateDistribution[], current: readonly PlateDistribution[] | null, inventory: readonly PlateInventoryItem[]): boolean => {
  if (current === null) return true
  const candidateScore = scorePlateCombination(previous, candidate, inventory)
  const currentScore = scorePlateCombination(previous, current, inventory)
  if (previous.length > 0 && candidateScore.preservedLargeWeight !== currentScore.preservedLargeWeight) return candidateScore.preservedLargeWeight > currentScore.preservedLargeWeight
  if (candidateScore.totalPlateCount !== currentScore.totalPlateCount) return candidateScore.totalPlateCount < currentScore.totalPlateCount
  if (candidateScore.simplificationBonus !== currentScore.simplificationBonus) return candidateScore.simplificationBonus > currentScore.simplificationBonus
  if (candidateScore.smallPlatePenalty !== currentScore.smallPlatePenalty) return candidateScore.smallPlatePenalty < currentScore.smallPlatePenalty
  if (candidateScore.mediumPlatePenalty !== currentScore.mediumPlatePenalty) return candidateScore.mediumPlatePenalty < currentScore.mediumPlatePenalty
  if (candidateScore.totalOperations !== currentScore.totalOperations) return candidateScore.totalOperations < currentScore.totalOperations
  return compareHigherPlates(candidate, current)
}

export const chooseBestProgressiveCombination = (previous: readonly PlateDistribution[], candidates: readonly PlateDistribution[][], inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PlateDistribution[] | null => {
  let best: PlateDistribution[] | null = null
  const normalizedCandidates = new Map<string, PlateDistribution[]>()
  candidates.forEach((candidate) => {
    const normalized = normalizePlateCombination(candidate, inventory)
    normalizedCandidates.set(combinationKey(normalized), normalized)
  })
  for (const candidate of normalizedCandidates.values()) {
    if (isBetterPracticalCombination(previous, candidate, best, inventory)) best = candidate
  }
  return best
}

export const calculatePlatesPerSide = (loadableWeight: number, barWeight: BarWeight, inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PlateDistribution[] | null => {
  const combinations = getNormalizedCandidates(loadableWeight, barWeight, inventory)
  return combinations.reduce<PlateDistribution[] | null>((best, candidate) => isBetterPracticalCombination([], candidate, best, inventory) ? candidate : best, null)
}

const getTotalIncrement = (options: PlateOption[]): number => {
  const smallestPlate = options.at(-1)
  return smallestPlate ? smallestPlate.weightInCentiKilos * 2 : 0
}

export const findLoadableWeight = (theoreticalWeight: number, barWeight: BarWeight, method: RoundingMethod, inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): number => {
  const barInCentiKilos = barWeight * CENTI_KILOS
  const options = getPlateOptions(inventory)
  const increment = getTotalIncrement(options)
  if (theoreticalWeight <= barInCentiKilos || increment === 0) return barInCentiKilos
  const lowerStart = barInCentiKilos + Math.floor((theoreticalWeight - barInCentiKilos) / increment) * increment
  let lower: number | null = null
  for (let candidate = lowerStart; candidate >= barInCentiKilos; candidate -= increment) {
    if (getNormalizedCandidates(candidate, barWeight, inventory).length > 0) { lower = candidate; break }
  }
  if (method === 'down') return lower ?? barInCentiKilos
  const hasUnlimitedPlate = options.some((option) => option.maxPerSide === null)
  const finiteMaximum = barInCentiKilos + 2 * options.reduce((total, option) => total + option.weightInCentiKilos * (option.maxPerSide ?? 0), 0)
  const upperStart = barInCentiKilos + Math.ceil((theoreticalWeight - barInCentiKilos) / increment) * increment
  const upperLimit = hasUnlimitedPlate ? upperStart + increment * MAX_UNLIMITED_SEARCH_STEPS : finiteMaximum
  let upper: number | null = null
  for (let candidate = Math.max(upperStart, barInCentiKilos); candidate <= upperLimit; candidate += increment) {
    if (getNormalizedCandidates(candidate, barWeight, inventory).length > 0) { upper = candidate; break }
  }
  if (lower === null) return upper ?? barInCentiKilos
  if (upper === null) return lower
  return theoreticalWeight - lower <= upper - theoreticalWeight ? lower : upper
}

export const calculateProgressivePlateBreakdowns = (loadableWeights: readonly number[], barWeight: BarWeight, inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PlateDistribution[][] => {
  let previous: PlateDistribution[] | null = null
  return loadableWeights.map((weight) => {
    const candidates = getNormalizedCandidates(weight, barWeight, inventory)
    const selected = previous === null
      ? candidates.reduce<PlateDistribution[] | null>((best, candidate) => isBetterPracticalCombination([], candidate, best, inventory) ? candidate : best, null)
      : chooseBestProgressiveCombination(previous, candidates, inventory)
    const breakdown = selected ?? []
    previous = breakdown
    return breakdown
  })
}

export const calculatePercentageResult = (rp: number, percentage: Percentage, barWeight: BarWeight, method: RoundingMethod, inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PercentageResult => {
  const theoreticalWeight = calculateTheoreticalWeight(rp, percentage)
  const loadableWeight = findLoadableWeight(theoreticalWeight, barWeight, method, inventory)
  return { percentage, theoreticalWeight, loadableWeight, difference: loadableWeight - theoreticalWeight, platesPerSide: calculatePlatesPerSide(loadableWeight, barWeight, inventory) ?? [] }
}

export const calculateProgressivePercentageResults = (rp: number, percentages: readonly Percentage[], barWeight: BarWeight, method: RoundingMethod, inventory: readonly PlateInventoryItem[] = DEFAULT_PLATE_INVENTORY): PercentageResult[] => {
  const baseResults = percentages.map((percentage) => calculatePercentageResult(rp, percentage, barWeight, method, inventory))
  const ascending = [...baseResults].sort((a, b) => a.percentage - b.percentage)
  const breakdowns = calculateProgressivePlateBreakdowns(ascending.map((result) => result.loadableWeight), barWeight, inventory)
  const breakdownByPercentage = new Map(ascending.map((result, index) => [result.percentage, breakdowns[index]]))
  return baseResults.map((result) => ({ ...result, platesPerSide: breakdownByPercentage.get(result.percentage) ?? [] }))
}
