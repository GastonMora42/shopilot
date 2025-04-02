// components/ui/PurchaseSummary.tsx
import { memo, useMemo, useState } from "react";
import { Seat, Section } from "@/types";
import { BuyerForm } from "../events/BuyerForm";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { SelectedGeneralTicket } from "@/types/event";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { TransferProofForm } from "../tickets/TransferProofForm";

interface BuyerInfo {
  name: string;
  email: string;
  phone?: string;
  dni?: string;
}

interface PurchaseSummaryProps {
  selectedSeats: Seat[];
  selectedTickets: SelectedGeneralTicket[];
  sections: Section[];
  eventType: 'SEATED' | 'GENERAL';
  isProcessing: boolean;
  showBuyerForm: boolean;
  setShowBuyerForm: (show: boolean) => void;
  onSubmit: (buyerInfo: any) => Promise<void>;
  onStartPurchase: () => Promise<void>;
  event: any; // El evento completo
}

export const PurchaseSummary = memo(function PurchaseSummary({
  selectedSeats,
  selectedTickets,
  sections,
  eventType,
  isProcessing,
  showBuyerForm,
  setShowBuyerForm,
  onSubmit,
  onStartPurchase,
  event
}: PurchaseSummaryProps) {
  const { data: session, status } = useSession();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const isLoading = status === 'loading';
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);

  // Obtener el método de pago y datos bancarios del evento
  const paymentMethod = event?.paymentMethod || 'MERCADOPAGO';
  const bankAccountData = event?.bankAccountData || event?.organizerId?.bankAccount;

  // Cálculos existentes
  const seatedTotal = useMemo(() => 
    selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
  , [selectedSeats]);

  const generalTotal = useMemo(() => 
    selectedTickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0)
  , [selectedTickets]);

  const formattedSelectedSeats = useMemo(() => {
    if (eventType !== 'SEATED') return '';
    return selectedSeats.map(seat => seat.label).join(', ');
  }, [selectedSeats, eventType]);

  // Manejador de compra con autenticación
  const handlePurchase = async () => {
    if (!session) {
      openAuthModal();
      return;
    }
    await onStartPurchase();
  };

  // Manejador modificado para el formulario del comprador
  const handleBuyerFormSubmit = async (formData: BuyerInfo) => {
    try {
      if (paymentMethod === 'BANK_TRANSFER') {
        // Guardar la información del comprador y mostrar formulario de transferencia
        setBuyerInfo(formData);
        setShowTransferForm(true);
        return;
      }
      
      // Si es MercadoPago, continuar con el flujo normal
      await onSubmit(formData);
    } catch (error) {
      console.error('Error en el proceso de compra:', error);
    }
  };

  // Manejador para enviar el comprobante de transferencia
  const handleTransferSubmit = async (transferData: { notes: string; proofImage: Blob }) => {
    try {
      // Convertir la imagen a base64
      const reader = new FileReader();
      return new Promise<void>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const imageBase64 = reader.result as string;
            
            // Enviar datos al endpoint
            const response = await fetch('/api/tickets/bank-transfer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId: event._id,
                eventType: event.eventType,
                ...(event.eventType === 'SEATED'
                  ? { seats: selectedSeats.map(s => s.seatId) }
                  : { 
                      ticketType: selectedTickets[0].ticketType,
                      quantity: selectedTickets[0].quantity 
                    }
                ),
                buyerInfo,
                proofImage: imageBase64,
                notes: transferData.notes,
                sessionId: uuidv4()
              })
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Error al procesar el ticket');
            }
            
            const data = await response.json();
            
            // Redirigir a página de éxito con el modo de transferencia
            router.push(`/payment/transfer-success?ticketId=${data.ticketId}`);
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(transferData.proofImage);
      });
    } catch (error) {
      console.error('Error:', error);
      // Mostrar error al usuario
    }
  };

  const isDisabled = 
    isLoading || 
    (eventType === 'SEATED' ? selectedSeats.length === 0 : selectedTickets.length === 0);

  return (
    <Card className="backdrop-blur-sm bg-white/90">
      <CardHeader>
        <CardTitle>Resumen de compra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>
            ${eventType === 'SEATED' ? seatedTotal : generalTotal}
          </span>
        </div>
        
        {eventType === 'SEATED' && (
          <div className="flex justify-between">
            <span>Asientos seleccionados:</span>
            <span>
              {selectedSeats.length > 0 ? formattedSelectedSeats : 'Ninguno'}
            </span>
          </div>
        )}

        {eventType === 'GENERAL' && (
          <div className="space-y-2">
            {selectedTickets.map(ticket => (
              <div key={ticket.ticketId} className="flex justify-between">
                <span>Ticket × {ticket.quantity}</span>
                <span>${ticket.price * ticket.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mostrar método de pago */}
        <div className="py-2 border-t border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Método de pago:</span>
            <span className="text-sm font-medium">
              {paymentMethod === 'MERCADOPAGO' ? 'MercadoPago' : 'Transferencia Bancaria'}
            </span>
          </div>
        </div>

        {showTransferForm ? (
          <TransferProofForm
            bankData={bankAccountData || {
              accountName: '',
              cbu: '',
              bank: '',
              additionalNotes: ''
            }}
            onSubmit={handleTransferSubmit}
            isLoading={isProcessing}
          />
        ) : showBuyerForm ? (
          <BuyerForm
            onSubmit={handleBuyerFormSubmit}
            isLoading={isProcessing}
          />
        ) : (
          <div className="space-y-3">
            <Button
              className="w-full"
              disabled={isDisabled}
              onClick={handlePurchase}
              variant="default"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Cargando...
                </div>
              ) : !session ? (
                'Iniciar sesión para comprar'
              ) : (
                'Continuar con la compra'
              )}
            </Button>
            
            {/* Mensajes de validación */}
            {!isLoading && (
              <>
                {eventType === 'SEATED' && selectedSeats.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Selecciona al menos un asiento para continuar
                  </p>
                )}
                {eventType === 'GENERAL' && selectedTickets.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Selecciona al menos un ticket para continuar
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Mensaje de método de pago */}
        {paymentMethod === 'BANK_TRANSFER' && !showTransferForm && showBuyerForm && (
          <div className="mt-4 text-sm bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-medium text-blue-700">Pago por transferencia bancaria</p>
            <p className="mt-1">
              Una vez completados tus datos, podrás subir el comprobante de transferencia.
            </p>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-4 text-sm text-gray-500">
          <ul className="space-y-1">
            {eventType === 'SEATED' ? (
              <>
                <li>• Los asientos se reservarán por 10 minutos</li>
                <li>• Debes completar la compra antes de que expire la reserva</li>
                <li>• Puedes seleccionar hasta 6 asientos por compra</li>
              </>
            ) : (
              <>
                <li>• Los tickets se reservarán por 10 minutos</li>
                <li>• Debes completar la compra antes de que expire la reserva</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
});

PurchaseSummary.displayName = 'PurchaseSummary';