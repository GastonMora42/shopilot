"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { GoogleSignInButton } from "./GoogleSignInButton"
import { useAuthModal } from "@/contexts/AuthModalContext"
import Image from "next/image"

export function AuthModal() {
    const { isOpen, closeAuthModal } = useAuthModal()

  return (
    <Dialog.Root open={isOpen} onOpenChange={closeAuthModal}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-lg w-[90vw] max-w-md p-6 z-50">
          {/* Logo section */}
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png"  // Asegúrate de tener tu logo
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>

          {/* Header */}
          <Dialog.Title className="text-xl font-bold text-center mb-2">
            Bienvenido
          </Dialog.Title>
          <Dialog.Description className="text-center text-gray-500 mb-6">
            Inicia sesión para comprar tickets y acceder a tus compras
          </Dialog.Description>

          {/* Auth buttons */}
          <div className="space-y-4">
          <GoogleSignInButton isModal={true} />
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Al continuar, aceptas nuestros{' '}
            <a href="/terms" className="underline hover:text-gray-900">
              Términos de servicio
            </a>{' '}
            y{' '}
            <a href="/privacy" className="underline hover:text-gray-900">
              Política de privacidad
            </a>
          </p>

          {/* Close button */}
          <Dialog.Close className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Cerrar</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}