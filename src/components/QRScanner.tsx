// components/QrScanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, X } from 'lucide-react';
const successSound = new Audio('/sounds/success.mp3');
const errorSound = new Audio('/sounds/error.mp3');


interface ScanResult {
  success: boolean;
  message: string;
  ticket?: {
    eventName: string;
    buyerName: string;
    seatNumber: string;
    status: string;
  };
}

export function QrScanner() {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    setScanner(html5QrCode);

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!scanner) return;

    try {
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        handleScanError
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
    }
  };

  const stopScanning = async () => {
    if (scanner?.isScanning) {
      await scanner.stop();
      setScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: decodedText })
      });

      const data = await response.json();

      setResult({
        success: response.ok,
        message: response.ok ? '¡Ticket válido!' : data.error,
        ticket: data.ticket
      });

      if (response.ok) {
        successSound.play();
      } else {
        errorSound.play();
      }

      // Pausar el scanner temporalmente
      await stopScanning();

      // Reiniciar después de 5 segundos
      setTimeout(async () => {
        setResult(null);
        await startScanning();
      }, 5000);

    } catch (error) {
      setResult({
        success: false,
        message: 'Error al validar el ticket'
      });
    }
  };

  const handleScanError = (error: string) => {
    if (!error.includes('No QR code found')) {
      console.error(error);
    }
  };

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, [scanner]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div id="qr-reader" className="w-full max-w-sm mx-auto" />
        <div className="mt-4 text-center text-sm text-gray-500">
          Apunta la cámara al código QR del ticket
        </div>
      </Card>
  
      {result && (
        <Card className={`p-4 ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {result.success ? (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '¡ACCESO PERMITIDO!' : result.message}
              </h3>
              {result.success && result.ticket && (
                <>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <p><strong>Evento:</strong> {result.ticket.eventName}</p>
                    <p><strong>Comprador:</strong> {result.ticket.buyerName}</p>
                    <p><strong>Asientos:</strong> {result.ticket.seatNumber}</p>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="inline-block px-4 py-2 bg-green-600 text-white rounded-full font-bold text-lg animate-pulse">
                      PUEDE PASAR
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          {!result.success && (
            <div className="mt-4 text-center">
              <span className="inline-block px-4 py-2 bg-red-600 text-white rounded-full font-bold text-lg">
                NO PUEDE PASAR
              </span>
            </div>
          )}
        </Card>
      )}
  
      <div className="flex justify-center">
        <Button
          variant={scanning ? "destructive" : "default"}
          onClick={scanning ? stopScanning : startScanning}
          className="w-full max-w-sm"
        >
          {scanning ? 'Detener Scanner' : 'Iniciar Scanner'}
        </Button>
      </div>
    </div>
  );
}