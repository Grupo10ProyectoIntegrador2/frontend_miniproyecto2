import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  User,
  Moon,
  Accessibility,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import * as authService from '../services/auth.service'
import AvatarSelector from '../components/auth/AvatarSelector'
import DashboardHeader from '../components/DashboardHeader'
import { validateUsername, validateEmail, validateRequired } from '../utils/validators'
import {
  getThemePreference,
  getAccessibilityPreferences,
  setThemePreference,
  toggleAccessibility,
  type ThemePreference,
} from '../lib/appearance'

type ActiveSection = 'perfil' | 'visualizacion' | 'accesibilidad'

export default function PerfilPage() {
  const { user, updateProfile, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Section tab state
  const activeTab = (searchParams.get('tab') as ActiveSection) || 'perfil'

  // Profile data states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('avatar-1')
  
  // Collapsible avatar selector state
  const [showAvatarGrid, setShowAvatarGrid] = useState(false)

  // Status states
  const [saving, setSaving] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Deletion modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Visualizacion & Accesibilidad states
  const [theme, setTheme] = useState('sistema')
  const [readableText, setReadableText] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Initialize fields once user is loaded
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setUsername(user.username || '')
      setEmail(user.email || '')
      setAvatarUrl(user.avatarUrl || 'avatar-1')
    }
  }, [user])

  // Sincronizar estado local con preferencias ya aplicadas al iniciar la app
  useEffect(() => {
    setTheme(getThemePreference())
    const prefs = getAccessibilityPreferences()
    setReadableText(prefs.readableText)
    setHighContrast(prefs.highContrast)
    setReduceMotion(prefs.reduceMotion)
  }, [])

  if (!user) return null

  // Utility to check if avatar is a full URL or ID
  const isUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')
  }

  // Color mapping for avatar initials
  const getAvatarColor = (avatar: string): string => {
    const colorMap: Record<string, string> = {
      'avatar-1': '#6c63ff',
      'avatar-2': '#10b981',
      'avatar-3': '#f59e0b',
      'avatar-4': '#ef4444',
      'avatar-5': '#3b82f6',
      'avatar-6': '#ec4899',
      'avatar-7': '#8b5cf6',
      'avatar-8': '#14b8a6',
    }
    return colorMap[avatar] || '#6c63ff'
  }

  // Switch tabs handler
  const handleTabChange = (section: ActiveSection) => {
    setSearchParams({ tab: section })
    setSuccessMessage('')
    setErrorMessage('')
  }

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme)
    setThemePreference(newTheme)
    setSuccessMessage('Tema actualizado correctamente.')
  }

  const handleAccessibilityToggle = (option: 'readable' | 'contrast' | 'motion') => {
    const next = toggleAccessibility(option, {
      readableText,
      highContrast,
      reduceMotion,
    })
    setReadableText(next.readableText)
    setHighContrast(next.highContrast)
    setReduceMotion(next.reduceMotion)
    setSuccessMessage('Ajustes de accesibilidad actualizados.')
  }

  // Username availability check on blur (Escenario 2)
  const handleUsernameBlur = async () => {
    const trimmedVal = username.trim().toLowerCase()
    if (!trimmedVal || trimmedVal === user.username.toLowerCase()) {
      setFieldErrors(prev => ({ ...prev, username: '' }))
      return
    }

    const formatError = validateUsername(trimmedVal)
    if (formatError) {
      setFieldErrors(prev => ({ ...prev, username: formatError }))
      return
    }

    setCheckingUsername(true)
    const isAvailable = await authService.checkUsernameAvailable(trimmedVal)
    setCheckingUsername(false)

    if (!isAvailable) {
      setFieldErrors(prev => ({
        ...prev,
        username: 'Ese nombre de usuario ya está en uso. Elige otro.'
      }))
    } else {
      setFieldErrors(prev => ({ ...prev, username: '' }))
    }
  }

  // Email availability check on blur (Escenario 3)
  const handleEmailBlur = async () => {
    const trimmedVal = email.trim().toLowerCase()
    if (!trimmedVal || trimmedVal === user.email.toLowerCase() || user.provider === 'google') {
      setFieldErrors(prev => ({ ...prev, email: '' }))
      return
    }

    const formatError = validateEmail(trimmedVal)
    if (formatError) {
      setFieldErrors(prev => ({ ...prev, email: formatError }))
      return
    }

    setCheckingEmail(true)
    const isAvailable = await authService.checkEmailAvailable(trimmedVal)
    setCheckingEmail(false)

    if (!isAvailable) {
      setFieldErrors(prev => ({
        ...prev,
        email: 'Ese correo ya está registrado. Por favor elige otro.'
      }))
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }))
    }
  }

  // Form submission (Escenario 1)
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    // Client side validation
    const fNameError = validateRequired(firstName, 'El nombre')
    const lNameError = validateRequired(lastName, 'El apellido')
    const userErrorMsg = validateUsername(username)

    const errors: Record<string, string> = {}
    if (fNameError) errors.firstName = fNameError
    if (lNameError) errors.lastName = lNameError
    if (userErrorMsg) errors.username = userErrorMsg

    // Validate email for non-Google users
    if (user.provider !== 'google') {
      const emailError = validateEmail(email.trim().toLowerCase())
      if (emailError) errors.email = emailError
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setErrorMessage('Por favor corrige los errores del formulario.')
      return
    }

    setSaving(true)

    try {
      const trimmedUser = username.trim().toLowerCase()
      const trimmedEmail = email.trim().toLowerCase()

      // Double-check username collision if changed
      if (trimmedUser !== user.username.toLowerCase()) {
        const usernameOk = await authService.checkUsernameAvailable(trimmedUser)
        if (!usernameOk) {
          setFieldErrors(prev => ({ ...prev, username: 'Ese nombre de usuario ya está en uso. Elige otro.' }))
          setSaving(false)
          return
        }
      }

      // Double-check email collision if changed (non-Google only)
      if (user.provider !== 'google' && trimmedEmail !== user.email.toLowerCase()) {
        const emailOk = await authService.checkEmailAvailable(trimmedEmail)
        if (!emailOk) {
          setFieldErrors(prev => ({ ...prev, email: 'Ese correo ya está registrado. Por favor elige otro.' }))
          setSaving(false)
          return
        }
      }

      // Proceed to update profile in Firestore (frontend updateProfile hook calls backend endpoint)
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: trimmedUser,
        avatarUrl,
        ...(user.provider !== 'google' ? { email: trimmedEmail } : {}),
      })

      setFieldErrors({})
      setSuccessMessage('¡Tu perfil se actualizó correctamente!')
      setShowAvatarGrid(false)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Ocurrió un error inesperado al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  // Delete account handler
  const handleDeleteAccount = async () => {
    setDeleting(true)
    setErrorMessage('')
    try {
      await deleteAccount()
      setShowDeleteConfirm(false)
      navigate('/login')
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'No se pudo eliminar la cuenta. Intenta de nuevo más tarde.')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 dark:bg-slate-950 transition-colors duration-200">
      <DashboardHeader />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Block */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Configuraciones
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-base">
            Administra tu perfil, la visualización y las opciones de accesibilidad.
          </p>
        </div>

        {/* Dynamic Alerts */}
        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-emerald-800 dark:border-emerald-950/30 dark:bg-emerald-950/20 dark:text-emerald-400 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
            <div className="text-sm font-medium">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 p-4 text-red-800 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400 animate-fade-in">
            <X className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500 cursor-pointer" onClick={() => setErrorMessage('')} />
            <div className="text-sm font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="flex flex-col gap-2">
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Secciones
              </span>

              {/* Editar Perfil tab */}
              <button
                onClick={() => handleTabChange('perfil')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left font-semibold text-sm transition-all cursor-pointer ${
                  activeTab === 'perfil'
                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${activeTab === 'perfil' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                <User className="h-4 w-4 shrink-0" />
                Editar perfil
              </button>

              {/* Visualizacion tab */}
              <button
                onClick={() => handleTabChange('visualizacion')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left font-semibold text-sm transition-all cursor-pointer ${
                  activeTab === 'visualizacion'
                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${activeTab === 'visualizacion' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                <Moon className="h-4 w-4 shrink-0" />
                Visualización
              </button>

              {/* Accesibilidad tab */}
              <button
                onClick={() => handleTabChange('accesibilidad')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left font-semibold text-sm transition-all cursor-pointer ${
                  activeTab === 'accesibilidad'
                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${activeTab === 'accesibilidad' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                <Accessibility className="h-4 w-4 shrink-0" />
                Accesibilidad
              </button>
            </nav>
            <p className="mt-4 px-3 text-xs text-slate-400 dark:text-slate-500 leading-relaxed hidden lg:block">
              Selecciona una sección para ajustar la experiencia del usuario.
            </p>
          </aside>

          {/* Main Panel Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
              
              {/* Tab 1: Editar perfil */}
              {activeTab === 'perfil' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Editar perfil
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Actualiza tus datos personales y la información visible para otras personas.
                    </p>
                  </div>

                  {/* Avatar section */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full text-white font-bold text-3xl shrink-0 overflow-hidden shadow-sm"
                      style={{ backgroundColor: isUrl(avatarUrl) ? 'transparent' : getAvatarColor(avatarUrl) }}
                    >
                      {isUrl(avatarUrl) ? (
                        <img
                          src={avatarUrl}
                          alt={`${firstName} ${lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        firstName.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {firstName || user.firstName} {lastName || user.lastName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Actualiza la imagen de tu avatar y tus datos de visualización.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAvatarGrid(!showAvatarGrid)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      {showAvatarGrid ? 'Ocultar Selector' : 'Cambiar'}
                    </button>
                  </div>

                  {/* Collapsible AvatarSelector Grid */}
                  {showAvatarGrid && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 animate-fade-in">
                      <AvatarSelector
                        selected={avatarUrl}
                        onSelect={(id) => setAvatarUrl(id)}
                        error={fieldErrors.avatarUrl}
                      />
                    </div>
                  )}

                  {/* Edit Form */}
                  <form onSubmit={handleSaveChanges} className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* FirstName */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={`auth-input dark:bg-slate-950 dark:border-slate-800 dark:text-white ${fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="Ingresa tu nombre"
                          required
                        />
                        {fieldErrors.firstName && (
                          <span className="text-xs text-red-500 font-medium">{fieldErrors.firstName}</span>
                        )}
                      </div>

                      {/* LastName */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={`auth-input dark:bg-slate-950 dark:border-slate-800 dark:text-white ${fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="Ingresa tu apellido"
                          required
                        />
                        {fieldErrors.lastName && (
                          <span className="text-xs text-red-500 font-medium">{fieldErrors.lastName}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Username */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center justify-between">
                          <span>Username</span>
                          {checkingUsername && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''));
                              if (fieldErrors.username) {
                                setFieldErrors(prev => ({ ...prev, username: '' }));
                              }
                              setErrorMessage('');
                            }}
                            onBlur={handleUsernameBlur}
                            className={`auth-input px-9 dark:bg-slate-950 dark:border-slate-800 dark:text-white ${fieldErrors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                            placeholder="@username"
                            required
                          />
                        </div>
                        {fieldErrors.username && (
                          <span className="text-xs text-red-500 font-medium">{fieldErrors.username}</span>
                        )}
                      </div>

                      {/* Correo / Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center justify-between">
                          <span>Correo</span>
                          {checkingEmail && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            if (user.provider !== 'google') {
                              setEmail(e.target.value)
                              if (fieldErrors.email) {
                                setFieldErrors(prev => ({ ...prev, email: '' }))
                              }
                              setErrorMessage('')
                            }
                          }}
                          onBlur={handleEmailBlur}
                          disabled={user.provider === 'google'}
                          className={`auth-input dark:border-slate-800 dark:text-white ${
                            user.provider === 'google'
                              ? 'opacity-60 bg-slate-50 dark:bg-slate-950/30 border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed text-slate-500 dark:text-slate-500'
                              : 'dark:bg-slate-950'
                          } ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="correo@institucion.edu"
                          required
                        />
                        {user.provider === 'google' ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                            El correo no se puede cambiar (cuenta de Google).
                          </span>
                        ) : (
                          fieldErrors.email && (
                            <span className="text-xs text-red-500 font-medium">{fieldErrors.email}</span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="submit"
                        disabled={saving || checkingUsername || checkingEmail || !!fieldErrors.username || !!fieldErrors.email}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Cambios'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 hover:bg-red-50/50 dark:border-red-950 dark:hover:bg-red-950/15 text-red-600 dark:text-red-400 font-bold text-sm px-5 py-3 transition-colors cursor-pointer"
                      >
                        Eliminar cuenta
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Visualización */}
              {activeTab === 'visualizacion' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Visualización
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Elige el tema de la pantalla y ajusta cómo se ve la interfaz.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100/80 dark:border-slate-800/80 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Visualización
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Personaliza el tema y la densidad de la interfaz.
                      </p>
                    </div>

                    {/* Theme select button grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {(['claro', 'oscuro', 'sistema'] as const).map((t) => {
                        const isSelected = theme === t
                        return (
                          <button
                            key={t}
                            onClick={() => handleThemeChange(t)}
                            className={`px-4 py-3 rounded-xl border text-center font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/60 dark:bg-indigo-950/20 border-blue-200 dark:border-indigo-900/60 text-blue-600 dark:text-indigo-400 ring-2 ring-blue-500/10 dark:ring-indigo-500/10'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Accesibilidad */}
              {activeTab === 'accesibilidad' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Editar perfil
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Adapta la plataforma para que sea más fácil de ver, leer y navegar según tus preferencias.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100/80 dark:border-slate-800/80 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Accesibilidad
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ajusta las configuraciones de legibilidad, contraste y movimiento.
                      </p>
                    </div>

                    {/* Accessibility buttons row */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleAccessibilityToggle('readable')}
                        className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          readableText
                            ? 'bg-blue-50/60 dark:bg-indigo-950/20 border-blue-200 dark:border-indigo-900/60 text-blue-600 dark:text-indigo-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        Texto legible
                      </button>

                      <button
                        onClick={() => handleAccessibilityToggle('contrast')}
                        className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          highContrast
                            ? 'bg-blue-50/60 dark:bg-indigo-950/20 border-blue-200 dark:border-indigo-900/60 text-blue-600 dark:text-indigo-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        Alto contraste
                      </button>

                      <button
                        onClick={() => handleAccessibilityToggle('motion')}
                        className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          reduceMotion
                            ? 'bg-blue-50/60 dark:bg-indigo-950/20 border-blue-200 dark:border-indigo-900/60 text-blue-600 dark:text-indigo-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        Reducir movimiento
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/80 p-6 max-w-md w-full animate-slide-up space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <button
                type="button"
                onClick={() => !deleting && setShowDeleteConfirm(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                disabled={deleting}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar cuenta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
