import AppRouter from './router/AppRouter'

/**
 * App – punto de entrada de la aplicación.
 * El skip-link es el primer elemento del DOM para cumplir WCAG 2.4.1 (Bypass Blocks).
 */
export default function App() {
  return (
    <>
      {/* Skip link – WCAG 2.2 criterio 2.4.1: permite saltarse la navegación */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <AppRouter />
    </>
  )
}
