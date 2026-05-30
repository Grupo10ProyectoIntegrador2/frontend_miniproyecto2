import { cn } from '../../lib/utils'

interface FormFieldProps {
  label: string
  id: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
  required?: boolean
}

export default function FormField({
  label,
  id,
  error,
  hint,
  children,
  className,
  required = false,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--color-text)]"
      >
        {label}
        {required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
      </label>
      {children}
      {error && (
        <p
          className="text-xs text-[var(--color-error)] animate-[fadeIn_0.2s_ease]"
          role="alert"
          id={`${id}-error`}
        >
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-[var(--color-text-muted)]" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  )
}
