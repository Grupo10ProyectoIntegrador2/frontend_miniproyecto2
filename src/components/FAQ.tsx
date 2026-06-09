import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: '¿Necesito un correo universitario para registrarme?',
    answer: 'Sí, para garantizar un ambiente de estudio seguro y exclusivo para estudiantes, requerimos un correo con dominio .edu para el registro inicial.',
  },
  {
    question: '¿Cuántas personas pueden estar en una sala de estudio?',
    answer: 'Nuestras salas colaborativas soportan hasta 10 personas simultáneas en videollamada HD para mantener una sesión productiva y sin interrupciones.',
  },
  {
    question: '¿Las salas de estudio son privadas?',
    answer: 'Sí, cada sala de estudio tiene un código único generado automáticamente. Solo las personas con las que compartas este código podrán unirse.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-muted/50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-primary dark:text-white sm:text-4xl">
          Preguntas Frecuentes
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Todo lo que necesitas saber sobre Salón de Estudio
        </p>

        <div className="mt-12 space-y-4 text-left">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none"
                onClick={() => toggleAccordion(index)}
                aria-expanded={openIndex === index}
              >
                <span className="text-sm sm:text-base font-bold text-foreground">{faq.question}</span>
                <ChevronDown 
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180 text-primary' : ''
                  }`} 
                />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border mt-2 pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
