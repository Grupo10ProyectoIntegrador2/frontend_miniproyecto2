import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center"
    >
      <h1 className="text-7xl font-bold text-[var(--color-primary)]">404</h1>
      <p className="mt-4 text-xl text-[var(--color-text)]">
        Pagina no encontrada
      </p>
      <p className="mt-2 text-[var(--color-text-muted)]">
        La ruta que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
