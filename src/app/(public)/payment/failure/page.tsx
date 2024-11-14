// app/(public)/payment/error/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-600">×</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Error en el pago</h1>
        <p className="text-gray-600">
          {error || 'Hubo un problema al procesar tu pago'}
        </p>
      </div>

      <div className="space-y-4">
        <Button asChild className="w-full">
          <Link href="/">
            Intentar nuevamente
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="w-full">
          <Link href="/contacto">
            Contactar soporte
          </Link>
        </Button>
      </div>
    </div>
  );
}