export type ThemePreference = 'claro' | 'oscuro' | 'sistema'

const THEME_KEY = 'theme'
const READABLE_KEY = 'access-readable'
const CONTRAST_KEY = 'access-contrast'
const MOTION_KEY = 'access-motion'

export function getThemePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'claro' || stored === 'oscuro' || stored === 'sistema') {
    return stored
  }
  return 'sistema'
}

export function getAccessibilityPreferences() {
  return {
    readableText: localStorage.getItem(READABLE_KEY) === 'true',
    highContrast: localStorage.getItem(CONTRAST_KEY) === 'true',
    reduceMotion: localStorage.getItem(MOTION_KEY) === 'true',
  }
}

function resolveDarkFromTheme(theme: ThemePreference): boolean {
  if (theme === 'oscuro') return true
  if (theme === 'claro') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement
  const isDark = resolveDarkFromTheme(theme)

  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

export function applyAccessibility(options: {
  readableText: boolean
  highContrast: boolean
  reduceMotion: boolean
}) {
  const root = document.documentElement
  root.classList.toggle('readable-text', options.readableText)
  root.classList.toggle('high-contrast', options.highContrast)
  root.classList.toggle('reduce-motion', options.reduceMotion)
}

/** Aplica tema y accesibilidad guardados (llamar al iniciar la app). */
export function applyStoredAppearancePreferences() {
  applyTheme(getThemePreference())
  applyAccessibility(getAccessibilityPreferences())
}

export function setThemePreference(theme: ThemePreference) {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export function toggleAccessibility(
  option: 'readable' | 'contrast' | 'motion',
  current: { readableText: boolean; highContrast: boolean; reduceMotion: boolean }
) {
  const next = { ...current }

  if (option === 'readable') {
    next.readableText = !current.readableText
    localStorage.setItem(READABLE_KEY, String(next.readableText))
  } else if (option === 'contrast') {
    next.highContrast = !current.highContrast
    localStorage.setItem(CONTRAST_KEY, String(next.highContrast))
  } else {
    next.reduceMotion = !current.reduceMotion
    localStorage.setItem(MOTION_KEY, String(next.reduceMotion))
  }

  applyAccessibility(next)
  return next
}

let systemThemeListener: (() => void) | null = null

/** Reacciona al cambio del tema del sistema cuando el usuario eligió "sistema". */
export function watchSystemTheme() {
  if (systemThemeListener) return

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  systemThemeListener = () => {
    if (getThemePreference() === 'sistema') {
      applyTheme('sistema')
    }
  }
  media.addEventListener('change', systemThemeListener)
}
