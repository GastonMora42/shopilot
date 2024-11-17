// src/app/(dashboard)/admin/settings/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react'; // Asegúrate de tener lucide-react instalado

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [status, setStatus] = useState<{
    success?: boolean;
    error?: string;
  }>({});

  useEffect(() => {
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

// En tu SettingsPage, actualiza la función disconnectMP:
const disconnectMP = async () => {
  if (!confirm('¿Estás seguro de que quieres desconectar tu cuenta de MercadoPago?')) {
    return;
  }

  setIsDisconnecting(true);

  try {
    const response = await fetch('/api/auth/mercadopago/disconnect', {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al desconectar la cuenta');
    }

    // Actualizar la sesión
    await updateSession();
    
    setStatus({
      success: true,
      error: undefined
    });

    // Recargar la página para actualizar el estado
    window.location.reload();

  } catch (error) {
    console.error('Error:', error);
    setStatus({
      success: false,
      error: error instanceof Error ? error.message : 'Error al desconectar la cuenta'
    });
  } finally {
    setIsDisconnecting(false);
  }
};

const getErrorMessage = (error: string) => {
  switch (error) {
    case 'no_code':
      return 'No se recibió el código de autorización';
    case 'mp_error':
      return 'Error al conectar con MercadoPago';
    case 'unauthorized_role':
      return 'No tienes permisos para conectar una cuenta de MercadoPago';
    case 'user_not_found':
      return 'Usuario no encontrado';
    case 'incomplete_mp_data':
      return 'Datos incompletos de MercadoPago';
    case 'mp_account_already_connected':
      return 'Esta cuenta de MercadoPago ya está conectada a otro usuario';
    case 'update_failed':
      return 'Error al actualizar la información del usuario';
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
            {session?.user?.mercadopago?.accessToken 
              ? 'Cuenta conectada exitosamente'
              : 'Cuenta desconectada exitosamente'}
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
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={disconnectMP}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  'Desconectar cuenta'
                )}
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