export default function AuthDivider() {
  return (
    <div className="relative my-6 flex items-center">
      <div className="flex-1 border-t border-[var(--color-border)]" />
      <span className="mx-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
        o
      </span>
      <div className="flex-1 border-t border-[var(--color-border)]" />
    </div>
  )
}
