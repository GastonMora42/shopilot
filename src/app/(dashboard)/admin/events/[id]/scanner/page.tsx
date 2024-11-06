// src/app/(dashboard)/admin/events/[id]/scanner/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { QrScanner } from '@/components/QRScanner';

export default function ScannerPage() {
  const params = useParams();
  const [, setScanResult] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<{
    status: 'idle' | 'validating' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const handleScan = async (qrData: string) => {
    try {
      setValidationStatus({ status: 'validating' });
      
      const response = await fetch(`/api/tickets/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: params.id,
          qrCode: qrData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error validando ticket');
      }

      setScanResult(qrData);
      setValidationStatus({
        status: 'success',
        message: 'Ticket válido'
      });

      // Reset después de 3 segundos
      setTimeout(() => {
        setScanResult(null);
        setValidationStatus({ status: 'idle' });
      }, 3000);

    } catch (error: any) {
      setValidationStatus({
        status: 'error',
        message: error.message
      });

      // Reset después de 3 segundos
      setTimeout(() => {
        setScanResult(null);
        setValidationStatus({ status: 'idle' });
      }, 3000);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scanner de Tickets</h1>

      <div className="mb-6">
      <QrScanner />
      </div>

      {validationStatus.status !== 'idle' && (
        <div className={`p-4 rounded-lg mb-4 ${
          validationStatus.status === 'validating' ? 'bg-yellow-100' :
          validationStatus.status === 'success' ? 'bg-green-100' :
          validationStatus.status === 'error' ? 'bg-red-100' : ''
        }`}>
          <p className="font-medium">
            {validationStatus.status === 'validating' && 'Validando ticket...'}
            {validationStatus.status === 'success' && '✅ ' + validationStatus.message}
            {validationStatus.status === 'error' && '❌ ' + validationStatus.message}
          </p>
        </div>
      )}
    </div>
  );
}