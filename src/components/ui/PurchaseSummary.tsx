// components/ui/PurchaseSummary.tsx
import { memo, useMemo } from "react";
import { Seat, Section } from "@/types";
import { BuyerForm } from "../events/BuyerForm";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { SelectedGeneralTicket } from "@/types/event";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useSession } from "next-auth/react";

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
  onStartPurchase
}: PurchaseSummaryProps) {
  const { data: session, status } = useSession();
  const { openAuthModal } = useAuthModal();
  const isLoading = status === 'loading';

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

        {showBuyerForm ? (
          <BuyerForm
            onSubmit={onSubmit}
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