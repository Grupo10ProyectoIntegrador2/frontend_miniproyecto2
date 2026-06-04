import Card from './ui/Card'
import { Video, MessageSquare, Users, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: <Video className="h-6 w-6 text-white" />,
    colorClass: 'bg-blue-500',
    title: 'Videollamadas HD',
    description: 'Conecta cara a cara con calidad profesional. Comparte pantalla y colabora en tiempo real.',
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-white" />,
    colorClass: 'bg-orange-500',
    title: 'Chat Persistente',
    description: 'Mensajes que se guardan entre sesiones. Nunca pierdas información importante.',
  },
  {
    icon: <Users className="h-6 w-6 text-white" />,
    colorClass: 'bg-emerald-500',
    title: 'Gestión de Salas',
    description: 'Crea salas privadas o únete con un código. Control total sobre tus sesiones.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-white" />,
    colorClass: 'bg-pink-500',
    title: 'Seguro y Privado',
    description: 'Solo para estudiantes universitarios. Correos .edu verificados para tu tranquilidad.',
  },
]

function Features() {
  return (
    <section className="bg-muted/50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="border border-border bg-card shadow-sm transition-shadow hover:shadow-md rounded-2xl overflow-hidden">
              <div className="p-8">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${feature.colorClass}`}>
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
