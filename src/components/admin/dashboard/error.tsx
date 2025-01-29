// app/(dashboard)/admin/error.tsx
'use client'

import { Button } from "@/components/ui/Button"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
      <p className="text-gray-500 mb-4 text-center max-w-md">
        Hubo un error al cargar los datos del dashboard. 
        Por favor, intenta nuevamente.
      </p>
      <Button onClick={reset}>
        Intentar nuevamente
      </Button>
    </div>
  )
}