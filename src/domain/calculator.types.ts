export type BarWeight = 15 | 20
export type RoundingMethod = 'nearest' | 'down'
export type Percentage = 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 | 95 | 100
export type PlateWeight = 20 | 15 | 10 | 5 | 2.5 | 1.25
export interface PlateInventoryItem { weight: PlateWeight; totalQuantity: number | null }
export interface PlateDistribution { plateWeight: PlateWeight; count: number }
export interface PlateTransitionCost {
  removedCount: number
  addedCount: number
  totalOperations: number
  preservedCount: number
  preservedWeight: number
}
export interface PlateCombinationScore {
  totalPlateCount: number
  smallPlatePenalty: number
  mediumPlatePenalty: number
  preservedLargeWeight: number
  removedCount: number
  addedCount: number
  totalOperations: number
  simplificationBonus: number
  finalScore: number
}
export interface PercentageResult { percentage: Percentage; theoreticalWeight: number; loadableWeight: number; difference: number; platesPerSide: PlateDistribution[] }
