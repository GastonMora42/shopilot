// components/QrScanner.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Check, X, Loader2, Camera, CameraOff, QrCode, AlertCircle, Keyboard } from 'lucide-react';

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
  date?: string;
  endDate?: string;
  eventDate?: string;
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
  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState('');
  const manualInputRef = useRef<HTMLInputElement>(null);

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

 // En QrScanner.tsx, modifica la función handleScanSuccess

const handleScanSuccess = async (decodedText: string) => {
  if (isProcessing) return;
  
  try {
    setIsProcessing(true);
    await stopScanning();

    console.log('QR Escaneado:', {
      rawText: decodedText,
      parsed: JSON.parse(decodedText)
    });

    // Usar try-catch específico para el parseo JSON
    let parsedData;
    try {
      parsedData = JSON.parse(decodedText);
    } catch (parseError) {
      throw new Error('Formato de QR inválido. Por favor, escanea un QR válido o usa el modo manual.');
    }

    // Verificar formato básico del QR
    if (!parsedData.ticketId || !parsedData.subTicketId) {
      throw new Error('QR incompleto o inválido. Por favor, intenta nuevamente.');
    }

    await validateTicket(decodedText, 'qr');
  } catch (error) {
    console.error('Error en validación por escaneo:', error);
    
    // Mostrar mensaje de error específico en caso de error
    setResult({
      success: false,
      message: error instanceof Error 
        ? error.message 
        : 'Error al validar el ticket. Intenta usar el modo manual.',
      ticket: null
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await validateTicket(manualId.trim(), 'manual');
    } catch (error) {
      console.error('Error en validación manual:', error);
      setResult({
        success: false,
        message: 'Error al validar el ID ingresado. Por favor, verifica el ID e intenta nuevamente.'
      });
      setShowModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateTicket = async (data: string, type: 'qr' | 'manual') => {
    const payload = type === 'qr' 
      ? { qrString: data }
      : { manualId: data };
    
    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
  
      // Manejo mejorado de respuestas no-OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }
  
      const responseData = await response.json();
  
      setResult({
        success: responseData.success,
        message: responseData.message,
        ticket: responseData.ticket
      });
  
      setShowModal(true);
    } catch (error) {
      console.error(`Error en validación ${type}:`, error);
      
      setResult({
        success: false,
        message: error instanceof Error 
          ? error.message 
          : `Error al procesar el ${type === 'qr' ? 'código QR' : 'ID ingresado'}`,
        ticket: null
      });
      
      setShowModal(true);
    }
  };

  const handleCloseResult = useCallback(() => {
    setShowModal(false);
    setResult(null);
    setManualId('');
    if (!manualMode) {
      startScanning();
    } else if (manualInputRef.current) {
      manualInputRef.current.focus();
    }
  }, [startScanning, manualMode]);

  const toggleMode = useCallback(() => {
    stopScanning();
    setManualMode(prev => !prev);
    setError(null);
    // Focus en el input cuando cambiamos a modo manual
    if (!manualMode) {
      setTimeout(() => {
        if (manualInputRef.current) {
          manualInputRef.current.focus();
        }
      }, 100);
    }
  }, [stopScanning, manualMode, manualInputRef]);

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
                  {result.ticket.date && (
                    <p><strong>Fecha:</strong> {new Date(result.ticket.date).toLocaleString()}</p>
                  )}
                  {result.ticket.endDate && (
                    <p><strong>Finaliza:</strong> {new Date(result.ticket.endDate).toLocaleString()}</p>
                  )}
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
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Scanner de Tickets
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleMode}
          className="flex items-center gap-2"
        >
          {manualMode ? (
            <>
              <Camera className="w-4 h-4" />
              Modo Cámara
            </>
          ) : (
            <>
              <Keyboard className="w-4 h-4" />
              Modo Manual
            </>
          )}
        </Button>
      </div>

      {manualMode ? (
        <Card className="p-6 bg-gradient-to-b from-gray-50 to-white">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            Ingreso Manual de ID
          </h3>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="manual-id" className="block text-sm font-medium text-gray-700 mb-1">
                ID del Ticket
              </label>
              <Input
                id="manual-id"
                ref={manualInputRef}
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Ingresa el ID del ticket"
                className="w-full"
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes encontrar este ID en la parte inferior del código QR impreso
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!manualId.trim() || isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Verificar Ticket
                </span>
              )}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              Escanear con Cámara
            </h3>
            <div className={`h-2 w-2 rounded-full ${scanning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          </div>

          <div className="relative">
            <div id="qr-reader" className="w-full aspect-square rounded-lg overflow-hidden" />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="bg-white p-4 rounded-lg text-center max-w-xs">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">{error}</p>
                  <div className="flex gap-2 mt-3 justify-center">
                    <Button 
                      onClick={startScanning}
                      size="sm"
                    >
                      Reintentar
                    </Button>
                    <Button 
                      onClick={toggleMode}
                      variant="outline"
                      size="sm"
                    >
                      Modo Manual
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" />
            Apunta la cámara al código QR del ticket
          </p>
        </Card>
      )}

      {!manualMode && (
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
      )}

      <ResultModal />
    </div>
  );
}