// src/components/QrScanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useParams } from 'next/navigation';

type ScanStatus = {
  isScanning: boolean;
  error?: string;
  data?: string;
};

export function QrScanner() {
  const params = useParams();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>({ isScanning: false });

  useEffect(() => {
    const handleQrCodeScan = (decodedText: string) => {
      setScanStatus({
        isScanning: true,
        data: decodedText
      });

      handleScanData(decodedText);
    };

    const initializeScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("qr-reader");
        
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          handleQrCodeScan,
          () => {} // Ignoramos los errores de escaneo
        );

        setScanStatus({ isScanning: true });
      } catch (error) {
        setScanStatus({
          isScanning: false,
          error: 'Error al iniciar la cámara'
        });
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .catch(() => {
            console.error("Error al detener el scanner");
          });
      }
    };
  }, []);

  const handleScanData = async (qrData: string) => {
    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          qrCode: qrData,
          eventId: params.id 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al validar el ticket');
      }

      setScanStatus({
        isScanning: true,
        data: 'Ticket validado correctamente'
      });

      setTimeout(() => {
        setScanStatus({ isScanning: true });
      }, 3000);

    } catch (error) {
      setScanStatus({
        isScanning: true,
        error: 'Error al validar el ticket'
      });

      setTimeout(() => {
        setScanStatus({ isScanning: true });
      }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden" />
      
      {scanStatus.error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {scanStatus.error}
        </div>
      )}
      
      {scanStatus.data && !scanStatus.error && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg">
          {scanStatus.data}
        </div>
      )}
    </div>
  );
}