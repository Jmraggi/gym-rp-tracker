import type { Exercise } from '../../exercises/exercises.types'

interface ExerciseSelectorProps {
  exercises: Exercise[]
  onSelect: (exerciseId: string) => void
  selectedExerciseId: string
}

export function ExerciseSelector({ exercises, onSelect, selectedExerciseId }: ExerciseSelectorProps) {
  return <aside aria-label="Selección de ejercicio" className="progress-selector">
    <label className="progress-selector__select">Ejercicio
      <select aria-label="Ejercicio para ver el progreso" onChange={(event) => onSelect(event.target.value)} value={selectedExerciseId}>
        {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
      </select>
    </label>
    <div className="progress-selector__desktop">
      <p>Ejercicios</p>
      <div role="list">{exercises.map((exercise) => <button aria-current={exercise.id === selectedExerciseId ? 'true' : undefined} className={exercise.id === selectedExerciseId ? 'is-active' : ''} key={exercise.id} onClick={() => onSelect(exercise.id)} role="listitem" type="button">{exercise.name}</button>)}</div>
    </div>
  </aside>
}
