import { Link } from 'react-router-dom'
import Button from './ui/Button'

export default function CTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 text-center text-white dark:from-blue-900 dark:to-fuchsia-950">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-6">
          ¿Listo para mejorar tus sesiones de estudio?
        </h2>
        <p className="text-lg sm:text-xl text-blue-100 dark:text-blue-200 mb-10 max-w-2xl mx-auto">
          Crea tu cuenta y empieza a estudiar mejor con tus compañeros
        </p>
        <Button 
          className="rounded-full bg-white text-slate-900 hover:bg-slate-100 border-0 px-10 py-7 text-lg font-bold shadow-lg transition-all hover:scale-105"
          asChild
        >
          <Link to="/registro">Comenzar Ahora</Link>
        </Button>
      </div>
    </section>
  )
}
