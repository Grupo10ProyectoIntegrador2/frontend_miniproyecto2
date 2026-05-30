function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
          <span className="text-sm font-bold text-slate-900">
            Salón de Estudio
          </span>
        </div>
        <p className="text-xs text-slate-500 text-center sm:text-right">
          2026 Salón de Estudio Colaborativo. Diseñado para estudiantes universitarios.
        </p>
      </div>
    </footer>
  )
}

export default Footer
