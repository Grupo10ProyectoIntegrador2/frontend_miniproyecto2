import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import Button from '../components/ui/Button'
import { createRoom } from '../services/rooms.service'
import { validateRoomName } from '../utils/validators'

export default function SalasCrearPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validationError = name.trim() ? validateRoomName(name) : null
  const isValid = name.trim().length > 0 && !validationError
  const displayError = error || validationError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameError = validateRoomName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const room = await createRoom(name)
      navigate(`/salas/${room.id}/chat`, { state: { room, justCreated: true }, replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la sala. Intenta de nuevo.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = [
    'auth-input w-full h-11 rounded-sm border text-sm text-center transition-all focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-white',
    displayError
      ? 'border-red-400 bg-red-50/50 focus:border-red-400 focus:ring-red-100 dark:border-red-500/60 dark:bg-red-950/20 dark:focus:ring-red-900/30'
      : isValid
        ? 'border-emerald-500 bg-[#E6F4EA] focus:border-emerald-500 focus:ring-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/25 dark:focus:ring-emerald-900/30'
        : 'border-slate-200 bg-slate-50 focus:border-violet-500 focus:ring-violet-100 dark:border-slate-700 dark:focus:border-violet-500 dark:focus:ring-violet-900/30',
  ].join(' ')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200">
      <DashboardHeader />

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6"
      >

        <div className="w-full max-w-lg animate-slide-up">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Crear Sala
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Completa el nombre y el sistema generará un ID único antes de enviarte al interior
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <label
                  htmlFor="room-name"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  Nombre de la sala
                </label>

                <input
                  id="room-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError('')
                  }}
                  maxLength={50}
                  autoFocus
                  placeholder="Ej: Sala de repaso nocturno"
                  className={inputClass}
                />

                {displayError && (
                  <p
                    className="mt-6 rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600 dark:border-red-950/50 dark:bg-red-950/20 dark:text-red-400"
                    role="alert"
                  >
                    {displayError}
                  </p>
                )}

                <p className={`text-left text-xs text-slate-500 dark:text-slate-400 ${displayError ? 'mt-3' : 'mt-1'}`}>
                  Usa un nombre claro para que el resto del grupo identifique la sala.
                </p>
              </div>

              <div className="rounded-lg border border-violet-100 bg-violet-50/40 px-4 py-3.5 text-left text-[13px] leading-relaxed text-slate-600 dark:border-violet-900/30 dark:bg-violet-950/15 dark:text-slate-400">
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  Al confirmar, se creará un ID único y entrarás como Administrador.
                </strong>{' '}
                La redirección ocurre de forma instantánea al interior de la nueva sala.
              </div>

              <div className="flex flex-wrap justify-center gap-9 pt-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className={`inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                    isValid
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 border-0 shadow-violet-100 dark:shadow-none'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shadow-none cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Crear Sala
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
