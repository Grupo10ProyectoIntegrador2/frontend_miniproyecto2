import { Link } from 'react-router-dom'
import Button from './ui/Button'

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-secondary blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Estudia mejor con tus companeros
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Salas colaborativas con videollamadas, chat en tiempo real y gestion de participantes. Todo lo que necesitas para sesiones de estudio productivas.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link to="/register">Comenzar Ahora</Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
            <Link to="/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Hero
