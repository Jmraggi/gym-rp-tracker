import type { PersonalRecord } from './personalRecords.types'

export const getBestPersonalRecord = (records: readonly PersonalRecord[]): PersonalRecord => [...records].sort((left, right) => right.weight - left.weight || right.achievedAt.localeCompare(left.achievedAt) || right.createdAt.localeCompare(left.createdAt))[0]

export const getLatestPersonalRecord = (records: readonly PersonalRecord[]): PersonalRecord => [...records].sort((left, right) => right.achievedAt.localeCompare(left.achievedAt) || right.createdAt.localeCompare(left.createdAt))[0]
