'use client'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CreditSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [creditsAdded, setCreditsAdded] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const external_reference = searchParams.get('external_reference');
    const payment_id = searchParams.get('payment_id');
    
    if (external_reference && payment_id) {
      // Opcionalmente, puedes verificar el estado del pago
      // Nota: los créditos se acreditarán vía webhook, no aquí
      console.log("Pago exitoso:", payment_id, external_reference);
      setLoading(false);
      
      // Determina si es una compra de paquete o personalizada
      const parts = external_reference.split('_');
      if (parts.length >= 3 && parts[0] === 'credits') {
        setCreditsAdded(true);
      }
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="bg-white shadow-lg rounded-lg p-8 my-8">
        <div className="text-center">
          {loading ? (
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-lg">Procesando tu compra...</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h1>
              <p className="text-lg text-gray-600 mb-6">
                Tu compra de créditos ha sido procesada correctamente.
              </p>
              <div className="text-sm text-gray-500 mb-6">
                <p>Los créditos serán acreditados a tu cuenta en breve.</p>
                <p>ID de Pago: {searchParams.get('payment_id')}</p>
              </div>
              <div className="space-y-4">
                <Link href="/admin/credits" className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition">
                  Ver mi balance de créditos
                </Link>
                <div>
                  <Link href="/admin" className="text-blue-500 hover:underline">
                    Volver al dashboard
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}