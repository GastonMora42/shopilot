// src/app/(dashboard)/admin/settings/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BankAccountForm } from '@/components/admin/BankAccountForm';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
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
    // Limpiar cualquier estado de error previos
    setStatus({});
    
    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${process.env.NEXT_PUBLIC_MP_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/mercadopago/callback`;
    window.location.href = authUrl;
  };

  const forceRefresh = () => {
    window.location.reload();
  };
  

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

      // Forzar actualización de la sesión
      await updateSession();
      
      // Actualizar el estado local
      setStatus({
        success: true,
        error: undefined
      });

      // Recargar la página completamente para asegurar actualización
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

// En el componente settings/page.tsx
const saveBankAccount = async (data: {
  accountName: string;
  cbu: string;
  bank: string;
  additionalNotes?: string;
}): Promise<void> => {
  try {
    const response = await fetch('/api/user/bank-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar datos bancarios');
    }

    // Actualizar la sesión para reflejar los cambios
    await updateSession();
    
    // No retornamos nada (void)
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'no_code':
        return 'No se recibió el código de autorización';
      case 'mp_error':
        return 'Error al conectar con MercadoPago';
      case 'mp_account_already_connected':
        return 'Esta cuenta de MercadoPago ya está conectada a otro usuario';
      case 'user_not_found':
        return 'Usuario no encontrado';
      case 'unknown':
        return 'Ocurrió un error inesperado';
      default:
        return 'Ocurrió un error al conectar la cuenta';
    }
  };

  // Función para verificar si MP está realmente conectado
  const isMPConnected = () => {
    return !!(session?.user?.mercadopago?.accessToken && session?.user?.mercadopago?.userId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">MercadoPago</h2>
        
        {status.success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {isMPConnected() ? 'Cuenta conectada exitosamente' : 'Cuenta desconectada exitosamente'}
          </div>
        )}

{status.error === 'mp_account_already_connected' && (
  <Button 
    variant="outline" 
    size="sm" 
    onClick={forceRefresh}
    className="mt-2"
  >
    Recargar página
  </Button>
)}
        
        <div className="space-y-4">
          {isMPConnected() ? (
            <div>
              <p className="text-green-600 flex items-center gap-2">
                <span className="text-lg">✓</span> 
                Cuenta vinculada
              </p>
              <p className="text-sm text-gray-600 mt-2">
                ID de usuario: {session?.user?.mercadopago?.userId}
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
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
  <h2 className="text-lg font-semibold mb-4">Datos Bancarios para Transferencias</h2>
  
  <BankAccountForm 
    initialData={session?.user?.bankAccount}
    onSave={saveBankAccount}
  />
</div>
      </div>
    </div>
  );
}


