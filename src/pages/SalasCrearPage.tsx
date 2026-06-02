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
      navigate(`/salas/${room.id}`, { state: { room, justCreated: true }, replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la sala. Intenta de nuevo.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20">
      <DashboardHeader />

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Crear Sala</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Completa el nombre y el sistema generará un ID único antes de enviarte al interior.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="room-name" className="text-sm font-bold text-slate-800 dark:text-slate-200">
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
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors dark:bg-slate-950 dark:text-white ${
                  validationError || error
                    ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/60 dark:bg-red-950/20'
                    : isValid
                      ? 'border-emerald-400 bg-emerald-50/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500/60 dark:bg-emerald-950/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700'
                }`}
              />

              {(validationError || error) && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400">
                  {error || validationError}
                </p>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usa un nombre claro para que el resto del grupo identifique la sala.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-4 text-sm leading-relaxed text-slate-700 dark:border-indigo-950/40 dark:bg-indigo-950/20 dark:text-slate-300">
              <strong>Al confirmar, se creará un ID único y entrarás como Administrador.</strong>{' '}
              La redirección ocurre de forma instantánea al interior de la nueva sala.
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200 px-5 dark:border-slate-700 dark:text-slate-200"
                onClick={() => navigate('/dashboard')}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || submitting}
                className={`rounded-xl px-6 ${
                  isValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Crear Sala
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
