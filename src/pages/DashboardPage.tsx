import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getExercises } from '../features/exercises/exercises.service'
import type { Exercise } from '../features/exercises/exercises.types'
import { DashboardMetrics, WorkoutAction } from '../features/dashboard/DashboardMetrics'
import { getExerciseProgress, getLatestImprovement, getPersonalRecordSummariesFromRecords, getWeeklyTrainingDays } from '../features/dashboard/dashboard.service'
import type { ExerciseProgress, LatestImprovement } from '../features/dashboard/dashboard.types'
import { getWorkoutCount, getWorkoutDates, markWorkoutComplete, removeWorkout, todayDate } from '../features/dashboard/workoutSessions.service'
import { getPersonalRecords } from '../features/personal-records/personalRecords.service'
import type { PersonalRecord } from '../features/personal-records/personalRecords.types'
import { useQuickAddPersonalRecord } from '../features/personal-records/useQuickAddPersonalRecord'

const palette = ['#60a5fa', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']
interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const formatKilograms = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })

function DashboardUtilityBar({ onDonate, onInstall }: { onDonate: () => void; onInstall: () => void }) {
  return <header className="dashboard-utility"><div className="dashboard-utility__brand" aria-label="Gym PR Tracker"><span>PR<br/><b>GYM</b></span></div><div><button aria-label="Donaciones" onClick={onDonate} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button><button aria-label="Instalar la aplicación" onClick={onInstall} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><rect height="19" rx="2" width="14" x="5" y="2"/><path d="M9 18h6"/></svg></button></div></header>
}

function DashboardModal({ children, onClose }: { children: ReactNode; onClose: () => void }) { return <div aria-modal="true" className="dashboard-modal-backdrop" role="dialog"><section className="dashboard-modal"><button aria-label="Cerrar" className="dashboard-modal__close" onClick={onClose} type="button">×</button>{children}</section></div> }

function ConsistencyGrid({ dates, markingWorkout, workoutCompleted, onMarkWorkout, onRemoveWorkout }: { dates: string[]; markingWorkout: boolean; workoutCompleted: boolean; onMarkWorkout: () => void; onRemoveWorkout: (date: string) => void }) {
  const loggedDays = new Set(dates)
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const dateKey = (day: number): string => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const cells = [...Array<null>(firstWeekday), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const monthLabel = today.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return <section aria-label={`Calendario de constancia de ${monthLabel}`} className="visual-dashboard__consistency"><div><h2>Constancia</h2><span>{monthLabel}</span></div><ol aria-hidden="true" className="visual-dashboard__weekdays">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => <li key={day}>{day}</li>)}</ol><ol className="visual-dashboard__calendar">{cells.map((day, index) => { if (!day) return <li aria-hidden="true" className="is-blank" key={`blank-${index}`}/>; const date = dateKey(day); const completed = loggedDays.has(date); return <li className={`${completed ? 'is-active ' : ''}${day === today.getDate() ? 'is-today' : ''}`} key={day}>{completed ? <button aria-label={`Eliminar entreno del ${date}`} onClick={() => onRemoveWorkout(date)} type="button">{day}</button> : day}</li> })}</ol><WorkoutAction markingWorkout={markingWorkout} onMarkWorkout={onMarkWorkout} workoutCompleted={workoutCompleted}/></section>
}

function VisualDashboard({ progresses, trainingDates, totalWorkouts, weeklyTrainingDays, latestImprovement, workoutCompleted, markingWorkout, onMarkWorkout, onRemoveWorkout, onAdd }: { progresses: ExerciseProgress[]; trainingDates: string[]; totalWorkouts: number; weeklyTrainingDays: number; latestImprovement: LatestImprovement | null; workoutCompleted: boolean; markingWorkout: boolean; onMarkWorkout: () => void; onRemoveWorkout: (date: string) => void; onAdd: () => void }) {
  const bars = progresses.slice(0, 6)
  const barMax = Math.max(...bars.map(({ bestRecord }) => bestRecord.weight), 1)
  return <section aria-label="Panel de progreso" className="visual-dashboard">
    <article className="visual-dashboard__bar-card" aria-label="PRs por ejercicio"><div className="visual-dashboard__pr-heading"><div><h1>PRs</h1><p>Tu mejor marca por ejercicio.</p></div><button aria-label="Agregar un PR" onClick={onAdd} type="button">+</button></div>{bars.length ? <div className="visual-dashboard__bars">{bars.map((progress, index) => <div className="visual-dashboard__bar" key={progress.exercise.id}><span>{progress.exercise.name}</span><i><b style={{ width: `${Math.max((progress.bestRecord.weight / barMax) * 100, 8)}%`, backgroundColor: palette[index] }}/></i><strong>{formatKilograms(progress.bestRecord.weight)}<small>kg</small></strong></div>)}</div> : <div className="visual-dashboard__bar-empty" aria-label="Todavía no hay marcas cargadas"><span>+</span></div>}</article>
    <DashboardMetrics latestImprovement={latestImprovement} totalWorkouts={totalWorkouts} weeklyTrainingDays={weeklyTrainingDays}/>
    <ConsistencyGrid dates={trainingDates} markingWorkout={markingWorkout} onMarkWorkout={onMarkWorkout} onRemoveWorkout={onRemoveWorkout} workoutCompleted={workoutCompleted}/><p className="visual-dashboard__instructions">Tocá “Marcar entreno” para sumarlo a tu constancia. Tocá un día azul para deshacerlo.</p>
  </section>
}

export function DashboardPage() {
  const { openQuickAddPersonalRecord } = useQuickAddPersonalRecord()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [trainingDates, setTrainingDates] = useState<string[]>([])
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingWorkout, setMarkingWorkout] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [installGuide, setInstallGuide] = useState<'android' | 'ios' | null>(null)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [aliasCopied, setAliasCopied] = useState(false)
  const refresh = useCallback(async () => { const [nextExercises, nextRecords, nextTrainingDates, nextWorkoutCount] = await Promise.all([getExercises(), getPersonalRecords(), getWorkoutDates(), getWorkoutCount()]); setExercises(nextExercises); setRecords(nextRecords); setTrainingDates(nextTrainingDates); setTotalWorkouts(nextWorkoutCount) }, [])

  useEffect(() => { void refresh().finally(() => setLoading(false)); const onRecordsChanged = () => { void refresh() }; window.addEventListener('personal-records-updated', onRecordsChanged); return () => window.removeEventListener('personal-records-updated', onRecordsChanged) }, [refresh])
  useEffect(() => { const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent) }; window.addEventListener('beforeinstallprompt', capturePrompt); return () => window.removeEventListener('beforeinstallprompt', capturePrompt) }, [])
  const progresses = useMemo(() => getPersonalRecordSummariesFromRecords(exercises, records).map((summary) => getExerciseProgress(summary.exercise, records)).filter((progress): progress is ExerciseProgress => progress !== null).sort((left, right) => right.latestRecord.achievedAt.localeCompare(left.latestRecord.achievedAt)), [exercises, records])
  const latestImprovement = useMemo(() => getLatestImprovement(exercises, records), [exercises, records])
  const weeklyTrainingDays = useMemo(() => getWeeklyTrainingDays(trainingDates), [trainingDates])
  const markTodayWorkout = async () => { setMarkingWorkout(true); try { await markWorkoutComplete(); await refresh() } catch { /* The button remains available for a retry without breaking the dashboard. */ } finally { setMarkingWorkout(false) } }
  const removeCompletedWorkout = async (date: string) => { setMarkingWorkout(true); try { await removeWorkout(date); await refresh() } finally { setMarkingWorkout(false) } }
  const openInstall = () => { setInstallGuide(null); setShowInstall(true) }
  const installAndroid = async () => { setInstallGuide('android'); if (!installPrompt) return; await installPrompt.prompt(); const { outcome } = await installPrompt.userChoice; if (outcome === 'accepted') setShowInstall(false); setInstallPrompt(null) }
  const copyDonationAlias = async () => { await navigator.clipboard?.writeText('juanmanuelraggi.mp'); setAliasCopied(true) }

  return <main className="app-shell dashboard-page dashboard-page--visual" aria-busy={loading}><DashboardUtilityBar onDonate={() => { setAliasCopied(false); setShowDonate(true) }} onInstall={openInstall}/><VisualDashboard latestImprovement={latestImprovement} markingWorkout={markingWorkout} onAdd={() => openQuickAddPersonalRecord()} onMarkWorkout={() => { void markTodayWorkout() }} onRemoveWorkout={(date) => { void removeCompletedWorkout(date) }} progresses={progresses} totalWorkouts={totalWorkouts} trainingDates={trainingDates} weeklyTrainingDays={weeklyTrainingDays} workoutCompleted={trainingDates.includes(todayDate())}/><footer className="dashboard-footer">Hecho con <span aria-label="amor">♥</span> · Raggi Juan Manuel</footer>{showDonate && <DashboardModal onClose={() => setShowDonate(false)}><p className="eyebrow">DONACIONES</p><h2>Esta app siempre es gratis.</h2><p>Nadie te va a cobrar nunca por usar Gym PR Tracker. Si te resulta útil y querés colaborar de forma voluntaria, podés enviar lo que quieras al siguiente alias.</p><div className="dashboard-donation-alias"><span>Alias Mercado Pago</span><strong>juanmanuelraggi.mp</strong></div><div className="dashboard-donation-actions"><button onClick={() => void copyDonationAlias()} type="button">{aliasCopied ? 'Alias copiado' : 'Copiar alias'}</button></div></DashboardModal>}{showInstall && <DashboardModal onClose={() => setShowInstall(false)}><p className="eyebrow">INSTALAR APP</p><h2>Llevá Gym PR al inicio.</h2><div className="dashboard-install-options"><button className={installGuide === 'android' ? 'is-active' : ''} onClick={() => void installAndroid()} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 9h10v10H7zM9 5l-1.3-2M15 5l1.3-2M9 13h.1M15 13h.1M7 17H5m14 0h-2"/></svg><span>Android</span></button><button className={installGuide === 'ios' ? 'is-active' : ''} onClick={() => setInstallGuide('ios')} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><rect height="18" rx="2" width="12" x="6" y="3"/><path d="M10 18h4"/></svg><span>iPhone</span></button></div>{installGuide === 'android' && <p className="dashboard-install-guide">{installPrompt ? 'Tocá para instalar Gym PR.' : 'Abrí el menú del navegador y elegí “Instalar app”.'}</p>}{installGuide === 'ios' && <p className="dashboard-install-guide">En Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”.</p>}</DashboardModal>}</main>
}
