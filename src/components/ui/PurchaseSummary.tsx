// components/ui/PurchaseSummary.tsx
import { memo, useMemo } from "react";
import { calculateSeatPrice } from "../../../utils/calculation";
import { BuyerForm } from "../events/BuyerForm";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

interface PurchaseSummaryProps {
  selectedSeats: string[];
  sections: Array<{
    rowStart: number;
    rowEnd: number;
    price: number;
    name: string;
  }>;
  isProcessing: boolean;
  showBuyerForm: boolean;
  setShowBuyerForm: (show: boolean) => void;
  onSubmit: (buyerInfo: any) => Promise<void>;
  onStartPurchase: () => Promise<void>; // Nueva prop para manejar el inicio de compra
}

export const PurchaseSummary = memo(function PurchaseSummary({
  selectedSeats,
  sections,
  isProcessing,
  showBuyerForm,
  setShowBuyerForm,
  onSubmit,
  onStartPurchase
}: PurchaseSummaryProps) {
  const total = useMemo(() => 
    selectedSeats.reduce((sum, seatId) => 
      sum + calculateSeatPrice(seatId, sections), 0
    ), [selectedSeats, sections]
  );

  const formattedSelectedSeats = useMemo(() => 
    selectedSeats.map(seatId => {
      const [row, col] = seatId.split('-');
      return `${String.fromCharCode(64 + parseInt(row))}${col}`;
    }).join(', '), [selectedSeats]
  );

  return (
    <Card className="backdrop-blur-sm bg-white/90">
      <CardHeader>
        <CardTitle>Resumen de compra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>${total.toLocaleString('es-ES')}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Asientos seleccionados:</span>
          <span>
            {selectedSeats.length > 0 ? formattedSelectedSeats : 'Ninguno'}
          </span>
        </div>

        {showBuyerForm ? (
          <BuyerForm
            onSubmit={onSubmit}
            isLoading={isProcessing}
          />
        ) : (
          <div className="space-y-3">
            <Button
              className="w-full"
              disabled={selectedSeats.length === 0}
              onClick={onStartPurchase} // Usar onStartPurchase en lugar de setShowBuyerForm
              variant="default"
            >
              Continuar con la compra
            </Button>
            {selectedSeats.length === 0 && (
              <p className="text-sm text-gray-500 text-center">
                Selecciona al menos un asiento para continuar
              </p>
            )}
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-4 text-sm text-gray-500">
          <ul className="space-y-1">
            <li>• Los asientos se reservarán por 10 minutos</li>
            <li>• Debes completar la compra antes de que expire la reserva</li>
            <li>• Puedes seleccionar hasta 6 asientos por compra</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
});

// Asegurarnos de que el componente tenga un nombre para debugging
PurchaseSummary.displayName = 'PurchaseSummary';