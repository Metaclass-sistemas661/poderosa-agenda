'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Carla Mendes',
    role: 'Dona do Salão Belíssima',
    location: 'São Paulo, SP',
    image: '/testimonials/carla.jpg',
    rating: 5,
    text: 'Antes eu perdia muito tempo anotando agendamentos em papel. Agora tudo é automático! Meus clientes adoram poder agendar pelo celular a qualquer hora.',
  },
  {
    name: 'Roberto Silva',
    role: 'Proprietário da Barbearia Vintage',
    location: 'Rio de Janeiro, RJ',
    image: '/testimonials/roberto.jpg',
    rating: 5,
    text: 'O controle financeiro mudou minha vida. Sei exatamente quanto cada barbeiro produziu e as comissões são calculadas automaticamente. Economia de horas!',
  },
  {
    name: 'Fernanda Costa',
    role: 'Gestora do Studio Hair',
    location: 'Belo Horizonte, MG',
    image: '/testimonials/fernanda.jpg',
    rating: 5,
    text: 'Os lembretes automáticos pelo WhatsApp reduziram minhas faltas em 70%! Isso era um problema sério antes. O investimento se pagou no primeiro mês.',
  },
  {
    name: 'André Oliveira',
    role: 'Dono da Rede Corte Certo (5 unidades)',
    location: 'Curitiba, PR',
    image: '/testimonials/andre.jpg',
    rating: 5,
    text: 'Gerenciar 5 barbearias era um caos. Com o Poderosa Agenda consigo ver tudo em um só lugar. Os relatórios me ajudam a tomar decisões muito melhores.',
  },
  {
    name: 'Juliana Santos',
    role: 'Proprietária do Espaço Beleza Total',
    location: 'Salvador, BA',
    image: '/testimonials/juliana.jpg',
    rating: 5,
    text: 'A plataforma é muito fácil de usar. Em 15 minutos já estava com tudo configurado. O suporte também é excelente, sempre respondem rápido!',
  },
  {
    name: 'Marcos Pereira',
    role: 'Sócio do Cabelo & Arte',
    location: 'Porto Alegre, RS',
    image: '/testimonials/marcos.jpg',
    rating: 5,
    text: 'O dashboard com gráficos me mostra exatamente como está o desempenho do salão. Consigo identificar os dias fracos e criar promoções específicas.',
  },
]

export function Testimonials() {
  return (
    <section id="depoimentos" className="py-24 bg-white overflow-hidden">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="badge-primary mb-4">Depoimentos</span>
          <h2 className="section-title mb-4">
            O que nossos clientes{' '}
            <span className="gradient-text">estão dizendo</span>
          </h2>
          <p className="section-subtitle">
            Mais de 10.000 salões já transformaram sua gestão com o Poderosa Agenda. 
            Veja o que alguns deles têm a dizer.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 relative"
            >
              {/* Quote Icon */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Quote className="w-5 h-5 text-primary-500" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                  <p className="text-xs text-gray-400">{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}