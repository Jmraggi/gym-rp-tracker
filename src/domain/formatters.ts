export const formatWeight = (centiKilos: number): string => (centiKilos / 100).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const formatDifference = (centiKilos: number): string => `${centiKilos > 0 ? '+' : ''}${formatWeight(centiKilos)}`
