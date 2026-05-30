import { Link } from 'react-router-dom'
import Button from './ui/Button'

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
      {/* Background decoration - Lighter and subtler */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-blue-50/50 to-transparent">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-purple-50/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Estudia mejor con <br className="hidden sm:block" /> tus compañeros
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 sm:text-xl">
          Salas colaborativas con videollamadas, chat en tiempo real y gestión de participantes. Todo lo que necesitas para sesiones de estudio productivas.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button className="w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 px-8 py-6 text-base font-semibold shadow-md transition-all hover:shadow-lg" asChild>
            <Link to="/registro">Comenzar Ahora</Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto rounded-full border border-purple-200 bg-white text-purple-600 hover:bg-purple-50 px-8 py-6 text-base font-semibold transition-all" asChild>
            <Link to="/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Hero
