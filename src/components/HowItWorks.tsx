import { UserPlus, DoorOpen, BookOpen } from 'lucide-react'

const steps = [
  {
    number: '1',
    colorClass: 'bg-blue-100 text-blue-600',
    badgeClass: 'bg-blue-600',
    icon: <UserPlus className="h-8 w-8" />,
    title: 'Regístrate',
    description: 'Crea tu cuenta con tu correo universitario .edu para acceso verificado',
  },
  {
    number: '2',
    colorClass: 'bg-emerald-100 text-emerald-600',
    badgeClass: 'bg-emerald-600',
    icon: <DoorOpen className="h-8 w-8" />,
    title: 'Crea o Únete',
    description: 'Crea una sala nueva o únete a una existente usando un código compartido',
  },
  {
    number: '3',
    colorClass: 'bg-orange-100 text-orange-600',
    badgeClass: 'bg-orange-500',
    icon: <BookOpen className="h-8 w-8" />,
    title: 'Estudia en Grupo',
    description: 'Colabora con videollamadas HD, chat en tiempo real y comparte recursos',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-primary dark:text-white sm:text-4xl">
          ¿Cómo funciona?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Comienza a estudiar en grupo en tres simples pasos
        </p>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center">
              <div className="relative mb-6">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${step.colorClass}`}>
                  {step.icon}
                </div>
                <div className={`absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${step.badgeClass}`}>
                  {step.number}
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground px-4">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
