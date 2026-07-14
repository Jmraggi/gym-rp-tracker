import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getExercises } from '../features/exercises/exercises.service'
import type { Exercise } from '../features/exercises/exercises.types'
import { DashboardView } from '../features/dashboard/DashboardView'
import { getExerciseProgress, getLatestImprovement, getPersonalRecordSummariesFromRecords, getWeeklyTrainingDays } from '../features/dashboard/dashboard.service'
import type { ExerciseProgress } from '../features/dashboard/dashboard.types'
import { getWorkoutCount, getWorkoutDates, markWorkoutComplete, removeWorkout, todayDate } from '../features/dashboard/workoutSessions.service'
import { getPersonalRecords } from '../features/personal-records/personalRecords.service'
import type { PersonalRecord } from '../features/personal-records/personalRecords.types'

interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const getErrorMessage = (error: unknown, fallback: string): string => error instanceof Error ? error.message : fallback

function DashboardUtilityBar({ onDonate, onInstall }: { onDonate: () => void; onInstall: () => void }) {
  return <header className="dashboard-utility"><div className="dashboard-utility__brand" aria-label="Gym PR Tracker"><span>PR<br/><b>GYM</b></span></div><div><button aria-label="Donaciones" onClick={onDonate} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button><button aria-label="Instalar la aplicación" onClick={onInstall} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><rect height="19" rx="2" width="14" x="5" y="2"/><path d="M9 18h6"/></svg></button></div></header>
}

function DashboardModal({ children, onClose }: { children: ReactNode; onClose: () => void }) { return <div aria-modal="true" className="dashboard-modal-backdrop" role="dialog"><section className="dashboard-modal"><button aria-label="Cerrar" className="dashboard-modal__close" onClick={onClose} type="button">×</button>{children}</section></div> }

export function DashboardPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [trainingDates, setTrainingDates] = useState<string[]>([])
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [markingWorkout, setMarkingWorkout] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [installGuide, setInstallGuide] = useState<'android' | 'ios' | null>(null)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [aliasCopied, setAliasCopied] = useState(false)
  const refresh = useCallback(async () => { const [nextExercises, nextRecords, nextTrainingDates, nextWorkoutCount] = await Promise.all([getExercises(), getPersonalRecords(), getWorkoutDates(), getWorkoutCount()]); setExercises(nextExercises); setRecords(nextRecords); setTrainingDates(nextTrainingDates); setTotalWorkouts(nextWorkoutCount) }, [])
  const loadDashboard = useCallback(async () => { setLoading(true); setLoadError(null); try { await refresh() } catch (error) { setLoadError(getErrorMessage(error, 'No se pudo cargar el dashboard.')) } finally { setLoading(false) } }, [refresh])

  useEffect(() => { void loadDashboard(); const onRecordsChanged = () => { void refresh().catch((error) => setLoadError(getErrorMessage(error, 'No se pudo actualizar el dashboard.'))) }; window.addEventListener('personal-records-updated', onRecordsChanged); return () => window.removeEventListener('personal-records-updated', onRecordsChanged) }, [loadDashboard, refresh])
  useEffect(() => { const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent) }; window.addEventListener('beforeinstallprompt', capturePrompt); return () => window.removeEventListener('beforeinstallprompt', capturePrompt) }, [])
  const progresses = useMemo(() => getPersonalRecordSummariesFromRecords(exercises, records).map((summary) => getExerciseProgress(summary.exercise, records)).filter((progress): progress is ExerciseProgress => progress !== null).sort((left, right) => right.latestRecord.achievedAt.localeCompare(left.latestRecord.achievedAt)), [exercises, records])
  const latestImprovement = useMemo(() => getLatestImprovement(exercises, records), [exercises, records])
  const weeklyTrainingDays = useMemo(() => getWeeklyTrainingDays(trainingDates), [trainingDates])
  const markTodayWorkout = async () => { setMarkingWorkout(true); setActionError(null); try { await markWorkoutComplete(); await refresh() } catch (error) { setActionError(getErrorMessage(error, 'No se pudo marcar el entreno. Intentá de nuevo.')) } finally { setMarkingWorkout(false) } }
  const removeCompletedWorkout = async (date: string) => { await removeWorkout(date); await refresh() }
  const openInstall = () => { setInstallGuide(null); setShowInstall(true) }
  const installAndroid = async () => { setInstallGuide('android'); if (!installPrompt) return; await installPrompt.prompt(); const { outcome } = await installPrompt.userChoice; if (outcome === 'accepted') setShowInstall(false); setInstallPrompt(null) }
  const copyDonationAlias = async () => { await navigator.clipboard?.writeText('juanmanuelraggi.mp'); setAliasCopied(true) }

  return <main className="app-shell dashboard-page dashboard-page--visual" aria-busy={loading}><DashboardUtilityBar onDonate={() => { setAliasCopied(false); setShowDonate(true) }} onInstall={openInstall}/>{loadError && <div className="dashboard-status is-error" role="alert"><span>{loadError}</span><button onClick={() => void loadDashboard()} type="button">Reintentar</button></div>}{actionError && <div className="dashboard-status is-error" role="alert"><span>{actionError}</span><button aria-label="Cerrar mensaje" onClick={() => setActionError(null)} type="button">×</button></div>}<DashboardView latestImprovement={latestImprovement} loading={loading} markingWorkout={markingWorkout} onMarkWorkout={() => { void markTodayWorkout() }} onRemoveWorkout={removeCompletedWorkout} progresses={progresses} totalWorkouts={totalWorkouts} trainingDates={trainingDates} weeklyTrainingDays={weeklyTrainingDays} workoutCompleted={trainingDates.includes(todayDate())}/><footer className="dashboard-footer">Hecho con <span aria-label="amor">♥</span> · Raggi Juan Manuel</footer>{showDonate && <DashboardModal onClose={() => setShowDonate(false)}><p className="eyebrow">DONACIONES</p><h2>Esta app siempre es gratis.</h2><p>Nadie te va a cobrar nunca por usar Gym PR Tracker. Si te resulta útil y querés colaborar de forma voluntaria, podés enviar lo que quieras al siguiente alias.</p><div className="dashboard-donation-alias"><span>Alias Mercado Pago</span><strong>juanmanuelraggi.mp</strong></div><div className="dashboard-donation-actions"><button onClick={() => void copyDonationAlias()} type="button">{aliasCopied ? 'Alias copiado' : 'Copiar alias'}</button></div></DashboardModal>}{showInstall && <DashboardModal onClose={() => setShowInstall(false)}><p className="eyebrow">INSTALAR APP</p><h2>Llevá Gym PR al inicio.</h2><div className="dashboard-install-options"><button className={installGuide === 'android' ? 'is-active' : ''} onClick={() => void installAndroid()} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 9h10v10H7zM9 5l-1.3-2M15 5l1.3-2M9 13h.1M15 13h.1M7 17H5m14 0h-2"/></svg><span>Android</span></button><button className={installGuide === 'ios' ? 'is-active' : ''} onClick={() => setInstallGuide('ios')} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><rect height="18" rx="2" width="12" x="6" y="3"/><path d="M10 18h4"/></svg><span>iPhone</span></button></div>{installGuide === 'android' && <p className="dashboard-install-guide">{installPrompt ? 'Tocá para instalar Gym PR.' : 'Abrí el menú del navegador y elegí “Instalar app”.'}</p>}{installGuide === 'ios' && <p className="dashboard-install-guide">En Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”.</p>}</DashboardModal>}</main>
}
