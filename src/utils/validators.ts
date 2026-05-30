import type { RegisterFormData, LoginFormData, FieldErrors } from '../types/auth.types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) {
    return `${fieldName} es obligatorio`
  }
  return null
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'El correo es obligatorio'
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Ingresa un correo electrónico válido'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'La contraseña es obligatoria'
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Debe incluir al menos una letra mayuscula'
  }
  if (!/[0-9]/.test(password)) {
    return 'Debe incluir al menos un numero'
  }
  return null
}

export function validateUsername(username: string): string | null {
  if (!username.trim()) {
    return 'El nombre de usuario es obligatorio'
  }
  if (username.length < 3) {
    return 'El nombre de usuario debe tener al menos 3 caracteres'
  }
  if (username.length > 20) {
    return 'El nombre de usuario no puede superar 20 caracteres'
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'Solo se permiten letras, numeros y guiones bajos'
  }
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) {
    return 'Debes confirmar tu contraseña'
  }
  if (password !== confirm) {
    return 'Las contraseñas no coinciden'
  }
  return null
}

export function validateRegisterForm(data: RegisterFormData): FieldErrors<RegisterFormData> {
  const errors: FieldErrors<RegisterFormData> = {}

  const nombresError = validateRequired(data.nombres, 'El nombre')
  if (nombresError) errors.nombres = nombresError

  const apellidosError = validateRequired(data.apellidos, 'El apellido')
  if (apellidosError) errors.apellidos = apellidosError

  const usernameError = validateUsername(data.username)
  if (usernameError) errors.username = usernameError

  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError

  const confirmError = validateConfirmPassword(data.password, data.confirmPassword)
  if (confirmError) errors.confirmPassword = confirmError

  if (!data.avatarUrl) {
    errors.avatarUrl = 'Selecciona un avatar'
  }

  return errors
}

export function validateLoginForm(data: LoginFormData): FieldErrors<LoginFormData> {
  const errors: FieldErrors<LoginFormData> = {}

  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  const passwordError = validateRequired(data.password, 'La contraseña')
  if (passwordError) errors.password = passwordError

  return errors
}
