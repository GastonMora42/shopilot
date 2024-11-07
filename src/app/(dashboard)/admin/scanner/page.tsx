// app/(dashboard)/admin/scanner/page.tsx
'use client';

import { useState } from 'react';
import { QrScanner } from '@/components/QRScanner';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ScanResult = {
  success: boolean;
  ticket?: {
    eventName: string;
    buyerName: string;
    seatNumber: string;
    status: string;
  };
  error?: string;
};

export default function ScannerPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  
  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Scanner de Tickets</h1>

      {scanning ? (
        <Card className="p-4">
          <QrScanner />
        </Card>
      ) : (
        <div className="space-y-4">
          {result && (
            <Alert>
              {result.success ? (
                <div className="space-y-2">
                  <p className="font-bold">✓ Ticket válido</p>
                  <p>Evento: {result.ticket?.eventName}</p>
                  <p>Asistente: {result.ticket?.buyerName}</p>
                  <p>Asiento: {result.ticket?.seatNumber}</p>
                </div>
              ) : (
                <p>{result.error}</p>
              )}
            </Alert>
          )}
          <Button 
            className="w-full" 
            onClick={() => {
              setScanning(true);
              setResult(null);
            }}
          >
            Escanear otro ticket
          </Button>
        </div>
      )}
    </div>
  );
}