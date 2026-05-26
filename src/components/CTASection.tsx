import { Link } from 'react-router-dom'
import Button from './ui/Button'

export default function CTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 text-center text-white">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-6">
          ¿Listo para mejorar tus sesiones de estudio?
        </h2>
        <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Crea tu cuenta y empieza a estudiar mejor con tus compañeros
        </p>
        <Button 
          className="rounded-full bg-white text-fuchsia-600 hover:bg-slate-50 border-0 px-10 py-7 text-lg font-bold shadow-lg transition-transform hover:scale-105" 
          asChild
        >
          <Link to="/registro">Comenzar Ahora</Link>
        </Button>
      </div>
    </section>
  )
}
