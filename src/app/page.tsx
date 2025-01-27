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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Ticket, Calendar, Shield, CreditCard, Map, Settings } from 'lucide-react'
import Link from 'next/link'
import { motion, useAnimation, useInView } from "framer-motion"
import Image from "next/image"
import InteractiveImage from '@/components/ui/InteractiveImageLanding'
import BackgroundImageSection from '@/components/ui/BackgroundImageLanding'
import BrandCarousel from '@/components/ui/BrandCarrousel'

interface Event {
  title: string;
  date: string;
  image: string;
  description: string;
  price: string;
}

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const featuresRef = useRef(null)
  const isInView = useInView(featuresRef, { once: true })


  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full bg-white border-b border-gray-100 shadow-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20"> {/* Aumentado a h-24 */}
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-18 w-auto object-contain max-w-[180px]" /* Ajustes principales aquí */
              />
            </div>
            <nav className="hidden md:flex items-center space-x-8">
      <Link href="/">
        <Button variant="ghost" className="text-gray-700 hover:text-[#FF5F1F] transition-colors text-base">Inicio</Button>
      </Link>
      <Link href="/blog">
        <Button variant="ghost" className="text-gray-700 hover:text-[#FF5F1F] transition-colors text-base">Precios</Button>
      </Link>
      <Link href="/blog">
        <Button variant="ghost" className="text-gray-700 hover:text-[#FF5F1F] transition-colors text-base">Guía de uso</Button>
      </Link>
      <Link href="/blog">
        <Button variant="ghost" className="text-gray-700 hover:text-[#FF5F1F] transition-colors text-base">Blog</Button>
      </Link>
    </nav>
            <Button 
              onClick={() => setIsLoginOpen(true)}
              className="bg-[#FF5F1F] text-white hover:bg-[#FF5F1F]/90 shadow-lg shadow-orange-500/20 px-6 py-2.5 text-base"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>
      {/* Hero Section Mejorado */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-[#FF5F1F]"
              >
                Gestiona Eventos como un Pro
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl mb-8 text-gray-600"
              >
                Plataforma todo en uno para crear, vender y gestionar eventos. 
                Comisiones más bajas garantizadas y cobros instantáneos.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
<Link href="/admin">
  <Button 
    size="lg" 
    className="bg-[#FF5F1F] text-white hover:bg-[#FF5F1F]/90 shadow-lg shadow-orange-500/20"
  >
    Crea Tu Evento Gratis
  </Button>
</Link>
<Link 
  href="https://wa.me/5492995882072"
  target="_blank"
  rel="noopener noreferrer"
>
  <Button 
    size="lg" 
    variant="outline" 
    className="border-[#FF5F1F] text-[#FF5F1F] hover:bg-[#FF5F1F]/10"
  >
    Contactanos
  </Button>
</Link>
              </motion.div>
            </div>
            <InteractiveImage />
          </div>
        </div>
      </section>

            {/* Brand Carousel */}
  

      {/* Nuevo Componente: Métricas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "1K+", label: "Eventos Creados" },
              { number: "50Mil+", label: "Tickets Vendidos" },
              { number: "0%", label: "Comisión Base" },
              { number: "24/7", label: "Soporte" },
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-[#FF5F1F]">{metric.number}</div>
                <div className="text-gray-600 mt-2">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BrandCarousel />


      {/* Características Principales */}
      <section className="py-20 bg-gray-50" ref={featuresRef}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Todo lo que necesitas para tu evento
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Settings />,
                title: "Configuración Intuitiva",
                description: "Crea eventos en minutos con nuestra interfaz drag & drop"
              },
              {
                icon: <Map />,
                title: "Mapas de Asientos Y Eventos Generales",
                description: "Diseña layouts personalizados para tus eventos o Vende entradas generales"
              },
              {
                icon: <CreditCard />,
                title: "Cobros Instantáneos",
                description: "Recibe tus fondos en tiempo real con las comisiones más bajas"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#FF5F1F]/10 mb-6">
                  <div className="text-[#FF5F1F]">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BackgroundImageSection />


      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/logo.png" alt="Logo" className="h-20 w-auto mb-4" />
              <p className="text-sm text-gray-600">
                Tu plataforma de confianza para eventos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Enlaces</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-[#FF5F1F]">Inicio</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#FF5F1F]">Eventos</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#FF5F1F]">Precios</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#FF5F1F]">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-[#FF5F1F]">Términos</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#FF5F1F]">Privacidad</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#FF5F1F]">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Contacto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>support@showspot.xyz</li>
                <li>+54 9 2995 88-2072</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-600">
            <p>&copy; 2025 ShowSpot. Todos los derechos reservados. Develop By www.jettlabs.xyz</p>
          </div>
        </div>
      </footer>

      {/* Login Sheet */}
      <Sheet open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <SheetContent className="bg-white">
          <SheetHeader>
          <br />
          <br />
          <br />
            <SheetTitle className="text-gray-900">Iniciar Sesión</SheetTitle>
            <SheetDescription className="text-gray-600">
              Ingresa tus credenciales para acceder a tu cuenta.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <GoogleSignInButton />
            <p className="mt-4 text-center text-sm text-gray-500">
              Al continuar, aceptas nuestros términos y condiciones.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}