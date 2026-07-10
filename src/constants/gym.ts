import type { Percentage, PlateInventoryItem } from '../domain/calculator.types'
export const AVAILABLE_PERCENTAGES: readonly Percentage[] = [50,55,60,65,70,75,80,85,90,95,100]
export const DEFAULT_PERCENTAGES: Percentage[] = [60,70,80,90]
export const DEFAULT_PLATE_INVENTORY: readonly PlateInventoryItem[] = [
  { weight: 20, totalQuantity: 2 },
  { weight: 15, totalQuantity: null },
  { weight: 10, totalQuantity: null },
  { weight: 5, totalQuantity: null },
  { weight: 2.5, totalQuantity: null },
  { weight: 1.25, totalQuantity: null },
]
