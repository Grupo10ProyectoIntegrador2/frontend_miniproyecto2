import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span className="font-medium text-foreground">Salon de Estudio</span>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            2024 Salon de Estudio Colaborativo. Disenado para estudiantes universitarios.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
