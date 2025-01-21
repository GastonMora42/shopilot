// components/QrScanner.tsx
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, X } from 'lucide-react';

// components/QRScanner.tsx
interface QRMetadata {
  timestamp: number;
  ticketId: string;
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seats: string[];
  };
  generalInfo?: {
    ticketType: string;
    index: number;
  };
}

interface BaseTicketInfo {
  eventName: string;
  buyerName: string;
  status: string;
  eventType: 'SEATED' | 'GENERAL';
  qrValidation: string;
  qrMetadata: QRMetadata;
}

interface SeatedTicketInfo extends BaseTicketInfo {
  eventType: 'SEATED';
  seat: string;
  qrMetadata: QRMetadata & {
    type: 'SEATED';
    seatInfo: {
      seats: string[];
    };
  };
}

interface GeneralTicketInfo extends BaseTicketInfo {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
  };
  quantity: number;
  qrMetadata: QRMetadata & {
    type: 'GENERAL';
    generalInfo: {
      ticketType: string;
      index: number;
    };
  };
}

type TicketInfo = SeatedTicketInfo | GeneralTicketInfo;

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: TicketInfo;
}

export function QrScanner() {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showModal, setShowModal] = useState(false);

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

// En handleScanSuccess:
const handleScanSuccess = async (decodedText: string) => {
  try {
    await stopScanning();

    const response = await fetch('/api/tickets/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrString: decodedText }) // Cambiado de qrCode a qrString
    });

    const data = await response.json();

    setResult({
      success: data.success,
      message: data.message,
      ticket: data.ticket
    });

    setShowModal(true);
  } catch (error) {
    setResult({
      success: false,
      message: 'Error al validar el ticket'
    });
    setShowModal(true);
  }
};

  const handleScanError = (error: string) => {
    if (!error.includes('No QR code found')) {
      console.error(error);
    }
  };

  const handleCloseResult = () => {
    setShowModal(false);
    setResult(null);
    startScanning(); // Reiniciar el scanner solo después de que el usuario cierre el resultado
  };

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, [startScanning, stopScanning]); 

  return (
    <div className="space-y-4">
      {/* Scanner */}
      <Card className="p-4">
        <div id="qr-reader" className="w-full max-w-sm mx-auto" />
        <div className="mt-4 text-center text-sm text-gray-500">
          Apunta la cámara al código QR del ticket
        </div>
      </Card>

   {/* Modal de Resultado */}
   {showModal && result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className={`w-full max-w-md p-6 ${
            result.success ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="text-center">
              {/* Icono */}
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
                {result.success ? (
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-10 h-10 text-red-600" />
                  </div>
                )}
              </div>

              {/* Mensaje Principal */}
              <h2 className={`text-2xl font-bold mb-4 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '¡ACCESO PERMITIDO!' : 'NO PUEDE PASAR'}
              </h2>

             {/* Detalles del Ticket */}
              {result.success && result.ticket && (
                <div className="mb-6 text-left">
                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <p><strong>Evento:</strong> {result.ticket.eventName}</p>
                    <p><strong>Comprador:</strong> {result.ticket.buyerName}</p>
                    {result.ticket.eventType === 'SEATED' ? (
                      <p><strong>Asiento:</strong> {result.ticket.seat}</p>
                    ) : (
                      <p><strong>Tipo de entrada:</strong> {result.ticket.ticketType.name}</p>
                    )}
                    <p><strong>Estado:</strong> {result.ticket.status}</p>
                  </div>
                </div>
              )}

              {/* Mensaje de Error */}
              {!result.success && (
                <p className="text-red-600 mb-6">{result.message}</p>
              )}

             {/* Botón de Cierre */}
             <Button 
                onClick={handleCloseResult}
                className="w-full text-lg py-6"
                variant={result.success ? "default" : "destructive"}
              >
                {result.success ? 'CONTINUAR' : 'CERRAR'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Botón de Control del Scanner */}
      <div className="flex justify-center">
        <Button
          variant={scanning ? "destructive" : "default"}
          onClick={scanning ? stopScanning : startScanning}
          className="w-full max-w-sm"
          disabled={showModal}
        >
          {scanning ? 'Detener Scanner' : 'Iniciar Scanner'}
        </Button>
      </div>
    </div>
  );
}