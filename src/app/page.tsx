// app/page.tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from "@/components/ui/Button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

export default function LandingPage() {
  const { data: session } = useSession()
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header minimalista */}
      <header className="fixed w-full bg-white border-b z-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <span className="text-xl font-semibold">EventosPro</span>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm hover:text-black/70">Inicio</a>
              <a href="#" className="text-sm hover:text-black/70">Eventos</a>
              <a href="#" className="text-sm hover:text-black/70">Precios</a>
              <a href="#" className="text-sm hover:text-black/70">Contacto</a>
            </nav>

            <Button 
              onClick={() => setIsLoginOpen(true)}
              className="bg-black text-white hover:bg-black/90"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section más limpio */}
      <section className="pt-32 pb-16">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              Bienvenido a EventosPro
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              La plataforma líder para la gestión y reserva de eventos. 
              Simplifica tu experiencia de compra de entradas y disfruta 
              de tus eventos favoritos sin complicaciones.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-black text-white hover:bg-black/90"
              >
                Comenzar Ahora
              </Button>
              <Button variant="outline">
                Saber Más
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-12">
            Nuestras Características
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-black/5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Reserva Fácil</h3>
              <p className="text-gray-600">Reserva tus entradas con solo unos clics.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-black/5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Gestión Simple</h3>
              <p className="text-gray-600">Administra tus eventos sin complicaciones.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-black/5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Acceso Seguro</h3>
              <p className="text-gray-600">Sistema de validación mediante QR.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimalista */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-3">EventosPro</h3>
              <p className="text-sm text-gray-600">
                Tu plataforma de confianza para eventos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Enlaces</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">Inicio</a></li>
                <li><a href="#" className="hover:text-black">Eventos</a></li>
                <li><a href="#" className="hover:text-black">Precios</a></li>
                <li><a href="#" className="hover:text-black">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">Términos</a></li>
                <li><a href="#" className="hover:text-black">Privacidad</a></li>
                <li><a href="#" className="hover:text-black">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contacto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>info@eventospro.com</li>
                <li>+1 234 567 890</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            <p>&copy; 2024 EventosPro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Login Sheet más limpio */}
      <Sheet open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Bienvenido</SheetTitle>
            <SheetDescription>
              Inicia sesión para comenzar.
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