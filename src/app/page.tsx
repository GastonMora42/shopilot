'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/Button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { Ticket, Shield, CreditCard, Map, Settings, Star, CheckCircle, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import InteractiveImage from '@/components/ui/InteractiveImageLanding'
import BackgroundImageSection from '@/components/ui/BackgroundImageLanding'
import BrandCarousel from '@/components/ui/BrandCarrousel'

interface _Event {
  title: string;
  date: string;
  image: string;
  description: string;
  price: string;
}

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Precios', href: '/blog' },
  { name: 'Guía de uso', href: '/blog' },
  { name: 'Blog', href: '/blog' },
]

const testimonials = [
  {
    name: "Jorge Spielman",
    role: "Organizadora de Fiestas",
    image: "/avatar1.jpeg",
    quote: "ShowSpot mejoro drasticamente la forma en que organizamos nuestras fiestas. La plataforma es increíblemente intuitiva y el soporte es excepcional."
  },
  {
    name: "Tomas Mora",
    role: "Promotor de Conciertos",
    image: "/avatar2.png",
    quote: "La gestión de tickets y el control de acceso son perfectos. Hemos aumentado nuestras ventas un 40% desde que usamos ShowSpot."
  },
  {
    name: "Mica Meindl",
    role: "Event Manager",
    image: "/avatar4.jpeg",
    quote: "La mejor plataforma que he usado. Lo mejor de todo son los cobros y la acreditacion instantanea! y el soporte 24/7 hacen que todo sea más fácil."
  }
]

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const featuresRef = useRef(null)
  const isInView = useInView(featuresRef, { once: true })

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header Mejorado */}
      <header className="fixed w-full bg-white border-b border-gray-100 shadow-sm z-50 backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/logo.png" 
                alt="ShowSpot Logo"
                width={180}
                height={60}
                className="object-contain"
                priority
              />
            </Link>
            <nav className="hidden lg:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-[#FF5F1F] transition-colors text-base font-medium hover:bg-orange-50 px-4 py-2 rounded-lg"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
            <Button 
              onClick={() => setIsLoginOpen(true)}
              className="bg-[#FF5F1F] text-white hover:bg-[#FF5F1F]/90 shadow-lg shadow-orange-500/20 px-6 py-3 text-base font-semibold transition-transform hover:scale-105"
              aria-label="Iniciar sesión"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section Mejorado */}
      <section className="pt-40 pb-28 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-[#FF5F1F] leading-tight"
              >
                Crea y colecciona momentos con ShowSpot
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed"
              >
                Plataforma todo en uno para crear, promocionar y monetizar eventos. 
                <span className="block mt-2 font-semibold text-[#FF5F1F]">0% comisiones + Cobros instantáneos</span>
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/admin" className="flex-1">
                  <Button 
                    size="lg" 
                    className="w-full bg-[#FF5F1F] text-white hover:bg-[#FF5F1F]/90 shadow-lg shadow-orange-500/20 py-6 text-lg font-semibold transition-transform hover:scale-[1.02]"
                  >
                    Comenzar Gratis
                  </Button>
                </Link>
                <Link 
                  href="https://wa.me/5492995882072"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full border-2 border-[#FF5F1F] text-[#FF5F1F] hover:bg-[#FF5F1F]/10 py-6 text-lg font-semibold transition-all"
                  >
                    Soporte 24/7
                  </Button>
                </Link>
              </motion.div>
              <div className="mt-8 flex items-center space-x-4">
  <div className="flex -space-x-3">
    {[
      { src: "/avatar1.jpeg", alt: "María González - Organizadora de eventos" },
      { src: "/avatar3.jpeg", alt: "María González - Organizadora de eventos" },
      { src: "/avatar4.jpeg", alt: "María González - Organizadora de eventos" },
      { src: "/avatar2.png", alt: "María González - Organizadora de eventos" }
    ].map((user, i) => (
      <div key={i} className="relative">
        <Image
          src={user.src}
          alt={user.alt}
          width={40}
          height={40}
          className="rounded-full border-2 border-white shadow-sm hover:z-10 transition-all"
          title={user.alt}
        />
      </div>
    ))}
  </div>
  <p className="text-gray-600">
    <span className="font-semibold text-[#FF5F1F]">+100 organizadores</span>
    <span className="block text-sm">confían en ShowSpot</span>
  </p>
</div>
            </div>
            <InteractiveImage />
          </div>
        </div>
      </section>

      {/* Métricas Mejoradas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "1K+", label: "Eventos Creados", icon: <LayoutDashboard className="w-6 h-6" /> },
              { number: "50Mil+", label: "Tickets Vendidos", icon: <Ticket className="w-6 h-6" /> },
              { number: "0%", label: "Comisión Base", icon: <Shield className="w-6 h-6" /> },
              { number: "24/7", label: "Soporte Prioritario", icon: <CheckCircle className="w-6 h-6" /> },
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4 text-[#FF5F1F]">
                  {metric.icon}
                </div>
                <div className="text-4xl font-bold text-gray-900">{metric.number}</div>
                <div className="text-gray-600 mt-2 font-medium">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Características Principales Mejoradas */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white" ref={featuresRef}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              La plataforma más completa para eventos
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas para crear, promocionar y monetizar tu evento
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Settings className="w-8 h-8" />,
                title: "Configuración Inteligente",
                description: "Interfaz intuitiva con herramientas profesionales para crear eventos en minutos",
                features: ["Drag & Drop", "Mapas personalizables", "Herramientas profesionales"]
              },
              {
                icon: <Map className="w-8 h-8" />,
                title: "Gestión Avanzada",
                description: "Control total sobre mapas de asientos y entradas",
                features: ["Diferentes tipos de entradas", "Control de aforo", "Entradas VIP"]
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "Monetización Instantánea",
                description: "Sistema de pagos integrado con las menores comisiones",
                features: ["Cobros en tiempo real", "Configuracion personalizable", "Reportes detallados"]
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#FF5F1F]/10 mb-6">
                  <div className="text-[#FF5F1F]">{feature.icon}</div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-3 text-left">
                  {feature.features.map((f, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-[#FF5F1F] mr-2" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Confianza */}
      <div className="bg-gray-50">
        <BrandCarousel />
      </div>
      {/* Sección de Demo Interactiva */}
      <BackgroundImageSection />

<section className="py-20 bg-white">
  <div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto text-center mb-16">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        ¿Qué dicen nuestros usuarios?
      </h2>
    </div>
    <div className="grid lg:grid-cols-3 gap-8">
      {testimonials.map((testimonial, i) => (
        <motion.div 
          key={i}
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <Image
              src={testimonial.image}
              alt={`Testimonio de ${testimonial.name}`}
              width={56}
              height={56}
              className="rounded-full object-cover"
            />
            <div className="ml-4">
              <h4 className="font-semibold">{testimonial.name}</h4>
              <p className="text-gray-600 text-sm">{testimonial.role}</p>
              <div className="flex mt-1 text-[#FF5F1F]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
          </div>
          <p className="text-gray-700 italic">
  '{testimonial.quote}'
</p>
        </motion.div>
      ))}
    </div>
  </div>
</section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-[#FF5F1F] to-[#FF8E53]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Crea tu primer evento en minutos y descubre por qué miles de organizadores 
            confían en ShowSpot
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/admin">
              <Button 
                className="bg-white text-[#FF5F1F] hover:bg-gray-100 px-12 py-6 text-lg font-bold shadow-lg"
              >
                Comenzar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Mejorado */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
            <Image 
  src="/logo.png"  // Versión clara para fondo oscuro
  alt="ShowSpot Logo"
  width={180}
  height={60}
  className="object-contain"
  priority
/>
              <p className="text-gray-400 mb-6">
                La plataforma líder para creación y gestión de eventos
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'instagram', 'linkedin'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={`Síguenos en ${social}`}
                  >
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Plataforma</h4>
              <ul className="space-y-3">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-gray-400 hover:text-white transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Recursos</h4>
              <ul className="space-y-3">
                {['Centro de ayuda', 'API Docs', 'Status', 'Seguridad'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Legal</h4>
              <ul className="space-y-3">
                {['Política de Privacidad', 'Términos de Servicio', 'Cookies'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 ShowSpot. Todos los derechos reservados.</p>
            <p className="mt-2">Developed with ❤️ by <a href="https://jettlabs.xyz" className="hover:text-white">JettLabs</a></p>
          </div>
        </div>
      </footer>

      {/* Login Sheet Mejorado */}
      <Sheet open={isLoginOpen} onOpenChange={setIsLoginOpen}>
      <SheetContent className="bg-white w-full max-w-md p-0">
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="p-8 border-b">
      <SheetHeader>
        <div className="flex justify-center mt-4 mb-8">
          <Image 
            src="/logo.png"
            alt="ShowSpot Logo"
            width={160}
            height={50}
            priority
          />
        </div>
        <SheetTitle className="text-2xl font-bold text-center">
          Bienvenido de nuevo
        </SheetTitle>
        <SheetDescription className="text-center">
          Accede a tu cuenta para gestionar eventos y comprar o revender tickets
        </SheetDescription>
      </SheetHeader>
    </div>

    {/* Content */}
    <div className="p-8 flex-1 overflow-y-auto">
      <div className="space-y-6">
        <GoogleSignInButton />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500"></span>
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="p-8 border-t">
      <p className="text-center text-sm text-gray-600">
        ¿No tienes una cuenta?{' '}
        <Link href="/registro" className="text-[#FF5F1F] font-medium hover:underline">
          Regístrate gratis
        </Link>
      </p>
      <p className="text-center text-xs text-gray-500 mt-4">
        Al continuar, aceptas nuestros{' '}
        <Link href="/terminos" className="underline hover:text-gray-700">
          Términos de servicio
        </Link>
        {' '}y{' '}
        <Link href="/privacidad" className="underline hover:text-gray-700">
          Política de privacidad
        </Link>
      </p>
    </div>
  </div>
</SheetContent>
</Sheet>
    </div>
  )
}