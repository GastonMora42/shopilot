// src/app/(public)/payment/transfer-success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { CheckCircle, Clock } from 'lucide-react';

export default function TransferSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('ticketId');
  
  if (!ticketId) {
    // Redirigir si no hay ticketId
    useEffect(() => {
      router.push('/admin');
    }, [router]);
    
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="mb-8">
        <img 
          src="/logo.png" 
          alt="ShowSpot Logo" 
          width={180} 
          height={60}
        />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold mt-4 mb-2">¡Solicitud recibida!</h1>
          <p className="text-gray-600">
            Tu ticket está pendiente de aprobación por parte del organizador.
          </p>
        </div>
        
        <div className="space-y-2 text-left bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> El organizador revisará tu comprobante de transferencia 
            y aprobará tu compra en breve. Recibirás un email cuando tu ticket esté listo.
          </p>
          <p className="text-sm text-blue-800">
            <strong>Ticket ID:</strong> {ticketId}
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/my-tickets">
              Ver mis tickets
            </Link>
          </Button>
          
          <Button asChild className="w-full">
            <Link href="/">
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}