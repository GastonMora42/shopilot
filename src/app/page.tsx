'use client'

import { useState } from 'react'
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
import { Ticket, Calendar, Shield } from 'lucide-react'
import Link from 'next/link'

interface Event {
  title: string;
  date: string;
  image: string;
  description: string;
}

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const events: Event[] = [
    {
      title: "Festival Urbano",
      date: "15 Ago 2024",
      image: "/placeholder.svg?height=400&width=600",
      description: "El mayor festival de cultura urbana del año."
    },
    {
      title: "Tech Summit",
      date: "22-25 Sep 2024",
      image: "/placeholder.svg?height=400&width=600",
      description: "Conferencia líder en innovación tecnológica."
    },
    {
      title: "Arte & Diseño",
      date: "10 Oct 2024",
      image: "/placeholder.svg?height=400&width=600",
      description: "Exposición de arte contemporáneo y diseño."
    }
  ];

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
      <Link href="/">
        <Button variant="ghost" className="text-gray-700 hover:text-[#FF5F1F] transition-colors text-base">Eventos</Button>
      </Link>
      <Link href="/">
        <Button variant="ghost" className="text-gray-700 hover:text-[#FF5F1F] transition-colors text-base">Precios</Button>
      </Link>
      <Link href="/">
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
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <br />
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-[#FF5F1F]">
              Coleccionando momentos
            </h1>
            <p className="text-xl mb-8 text-gray-600">
              Descubre experiencias únicas con la plataforma más innovadora del mercado.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-[#FF5F1F] text-white hover:bg-[#FF5F1F]/90 shadow-lg shadow-orange-500/20"
              >
                Explorar Eventos
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-[#FF5F1F] text-[#FF5F1F] hover:bg-[#FF5F1F]/10"
              >
                Crear Evento
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Eventos Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((event: Event, index: number) => (
              <Card key={index} className="group bg-white border-gray-100 hover:border-[#FF5F1F]/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-48 object-cover rounded-t-lg" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-gray-900">{event.title}</CardTitle>
                  <CardDescription className="text-[#FF5F1F] font-medium">
                    {event.date}
                  </CardDescription>
                  <p className="mt-2 text-gray-600">{event.description}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-gray-900 text-white hover:bg-[#FF5F1F] transition-colors shadow-lg">
                    <Ticket className="mr-2 h-4 w-4" /> Comprar Entradas
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Nuestras Características
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-[#FF5F1F]/10">
                <Calendar className="h-6 w-6 text-[#FF5F1F]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-900">Reserva Fácil</h3>
              <p className="text-gray-600 text-center">Reserva tus entradas con solo unos clics.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-[#FF5F1F]/10">
                <Ticket className="h-6 w-6 text-[#FF5F1F]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-900">Gestión Simple</h3>
              <p className="text-gray-600 text-center">Administra tus eventos sin complicaciones.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-[#FF5F1F]/10">
                <Shield className="h-6 w-6 text-[#FF5F1F]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-900">Acceso Seguro</h3>
              <p className="text-gray-600 text-center">Sistema de validación mediante QR.</p>
            </div>
          </div>
        </div>
      </section>

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
            <p>&copy; 2025 ShowSpot. Todos los derechos reservados.</p>
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