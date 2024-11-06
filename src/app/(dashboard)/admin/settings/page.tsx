// src/app/(dashboard)/admin/settings/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<{
    success?: boolean;
    error?: string;
  }>({});

  useEffect(() => {
    // Manejar respuestas de la conexión MP
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      setStatus({ success: true });
    } else if (error) {
      setStatus({ error: getErrorMessage(error) });
    }
  }, [searchParams]);

  const connectMP = () => {
    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${process.env.NEXT_PUBLIC_MP_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/mercadopago/callback`;
    window.location.href = authUrl;
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'no_code':
        return 'No se recibió el código de autorización';
      case 'mp_error':
        return 'Error al conectar con MercadoPago';
      default:
        return 'Ocurrió un error al conectar la cuenta';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">MercadoPago</h2>
        
        {status.success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            Cuenta conectada exitosamente
          </div>
        )}

        {status.error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {status.error}
          </div>
        )}
        
        <div className="space-y-4">
          {session?.user?.mercadopago?.accessToken ? (
            <div>
              <p className="text-green-600 flex items-center gap-2">
                <span className="text-lg">✓</span> 
                Cuenta vinculada
              </p>
              <p className="text-sm text-gray-600 mt-2">
                ID de usuario: {session.user.mercadopago.userId}
              </p>
              {/* Opcional: Botón para desconectar */}
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  // Implementar lógica de desconexión
                }}
              >
                Desconectar cuenta
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-2">
                Vincula tu cuenta de MercadoPago para recibir pagos directamente.
              </p>
              <Button onClick={connectMP}>
                Conectar MercadoPago
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}