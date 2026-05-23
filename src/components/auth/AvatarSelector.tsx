import { cn } from '../../lib/utils'

const AVATARS = [
  { id: 'avatar-1', color: '#6c63ff', label: 'Morado' },
  { id: 'avatar-2', color: '#10b981', label: 'Verde' },
  { id: 'avatar-3', color: '#f59e0b', label: 'Amarillo' },
  { id: 'avatar-4', color: '#ef4444', label: 'Rojo' },
  { id: 'avatar-5', color: '#3b82f6', label: 'Azul' },
  { id: 'avatar-6', color: '#ec4899', label: 'Rosa' },
  { id: 'avatar-7', color: '#8b5cf6', label: 'Violeta' },
  { id: 'avatar-8', color: '#14b8a6', label: 'Teal' },
]

interface AvatarSelectorProps {
  selected: string
  onSelect: (avatarId: string) => void
  error?: string
}

export default function AvatarSelector({ selected, onSelect, error }: AvatarSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--color-text)]">
        Avatar <span className="ml-0.5 text-[var(--color-error)]">*</span>
      </p>
      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((avatar) => {
          const isSelected = selected === avatar.id
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              aria-label={`Avatar ${avatar.label}`}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200',
                'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                isSelected
                  ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-surface)]'
                  : 'ring-1 ring-[var(--color-border)]'
              )}
              style={{ backgroundColor: avatar.color }}
            >
              {/* Iniciales genéricas */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
              </svg>
              {isSelected && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
