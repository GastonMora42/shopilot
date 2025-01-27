// components/QrScanner.tsx
import { useState, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, X, Loader2, Camera, CameraOff, QrCode, AlertCircle } from 'lucide-react';

interface QRMetadata {
  subTicketId: string;
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seat: string;
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
  validatedAt?: Date;
  qrMetadata: QRMetadata;
  buyerInfo: {
    name: string;
    dni: string;
  };
}

interface SeatedTicketInfo extends BaseTicketInfo {
  eventType: 'SEATED';
  seat: string;
  seatInfo: {
    seat: string;
  };
}

interface GeneralTicketInfo extends BaseTicketInfo {
  eventType: 'GENERAL';
  ticketType: string;
  generalInfo: {
    ticketType: string;
    index: number;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader", {
      verbose: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    });
    setScanner(html5QrCode);

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop();
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!scanner) return;
    setError(null);

    try {
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false,
        },
        handleScanSuccess,
        handleScanError
      );
      setCameraPermission(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setCameraPermission(false);
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      setScanning(false);
    }
  }, [scanner]);

  const stopScanning = useCallback(async () => {
    if (scanner?.isScanning) {
      await scanner.stop();
      setScanning(false);
    }
  }, [scanner]);

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await stopScanning();

      console.log('QR Escaneado:', {
        rawText: decodedText,
        parsed: JSON.parse(decodedText)
      });

      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrString: decodedText })
      });

      const data = await response.json();

      setResult({
        success: data.success,
        message: data.message,
        ticket: data.ticket
      });

      setShowModal(true);
    } catch (error) {
      console.error('Error en validación:', error);
      setResult({
        success: false,
        message: 'Error al validar el ticket. Por favor, intenta nuevamente.'
      });
      setShowModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanError = (error: string) => {
    if (!error.includes('No QR code found')) {
      console.error('Error en escaneo:', error);
    }
  };

  const handleCloseResult = useCallback(() => {
    setShowModal(false);
    setResult(null);
    startScanning();
  }, [startScanning]);

  const ResultModal = () => {
    if (!showModal || !result) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
        <Card className={`w-full max-w-md p-6 ${
          result.success ? 'bg-green-50/90 backdrop-blur' : 'bg-red-50/90 backdrop-blur'
        }`}>
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              result.success ? 'bg-green-100 animate-bounceIn' : 'bg-red-100 animate-shakeX'
            }`}>
              {result.success ? (
                <Check className="w-10 h-10 text-green-600" />
              ) : (
                <X className="w-10 h-10 text-red-600" />
              )}
            </div>

            <h2 className={`text-2xl font-bold mb-4 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '¡ACCESO PERMITIDO!' : 'NO PUEDE PASAR'}
            </h2>

            {result.ticket && (
              <div className="mb-6">
                <Card className="bg-white/90 backdrop-blur p-4 space-y-2">
                  <p><strong>Evento:</strong> {result.ticket.eventName}</p>
                  <p><strong>Comprador:</strong> {result.ticket.buyerInfo.name}</p>
                  <p><strong>DNI:</strong> {result.ticket.buyerInfo.dni}</p>
                  {result.ticket.eventType === 'SEATED' ? (
                    <p><strong>Asiento:</strong> {result.ticket.seat}</p>
                  ) : (
                    <>
                      <p><strong>Tipo:</strong> {result.ticket.ticketType}</p>
                      <p><strong>Número:</strong> {(result.ticket.generalInfo.index + 1)}</p>
                    </>
                  )}
                  <div className={`mt-2 py-1 px-2 rounded-full text-sm font-medium inline-block ${
                    result.ticket.status === 'USED' 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {result.ticket.status}
                  </div>
                  {result.ticket.validatedAt && (
                    <p className="text-sm text-gray-500">
                      Validado: {new Date(result.ticket.validatedAt).toLocaleString()}
                    </p>
                  )}
                </Card>
              </div>
            )}

            {!result.success && (
              <div className="mb-6 flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <p>{result.message}</p>
              </div>
            )}

            <Button 
              onClick={handleCloseResult}
              className="w-full text-lg py-6 transition-all duration-200 transform hover:scale-105"
              variant={result.success ? "default" : "destructive"}
            >
              {result.success ? 'CONTINUAR' : 'CERRAR'}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <Card className="p-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scanner de Tickets
          </h2>
          <div className={`h-2 w-2 rounded-full ${scanning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        </div>

        <div className="relative">
          <div id="qr-reader" className="w-full aspect-square rounded-lg overflow-hidden" />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="bg-white p-4 rounded-lg text-center max-w-xs">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700">{error}</p>
                <Button 
                  onClick={startScanning}
                  className="mt-3"
                  size="sm"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" />
          Apunta la cámara al código QR del ticket
        </p>
      </Card>

      <Button
        variant={scanning ? "destructive" : "default"}
        onClick={scanning ? stopScanning : startScanning}
        className="w-full transition-all duration-200"
        disabled={showModal || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando...
          </span>
        ) : scanning ? (
          <span className="flex items-center gap-2">
            <CameraOff className="w-4 h-4" />
            Detener Scanner
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Iniciar Scanner
          </span>
        )}
      </Button>

      <ResultModal />
    </div>
  );
}