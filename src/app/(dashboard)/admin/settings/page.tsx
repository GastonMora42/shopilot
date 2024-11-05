// src/app/(dashboard)/admin/settings/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { data: session } = useSession();

  const connectMP = () => {
    window.location.href = '/api/auth/mercadopago';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">MercadoPago</h2>
        
        <div className="space-y-4">
          {session?.user?.mercadopago?.accessToken ? (
            <div>
              <p className="text-green-600">✓ Cuenta vinculada</p>
              <p className="text-sm text-gray-600">
                ID de usuario: {session.user.mercadopago.userId}
              </p>
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