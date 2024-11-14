import { memo, useMemo } from "react";
import { calculateSeatPrice } from "../../../utils/calculation";
import { BuyerForm } from "../events/BuyerForm";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

  
  // components/events/PurchaseSummary.tsx
  interface PurchaseSummaryProps {
    selectedSeats: string[];
    sections: Array<{
      rowStart: number;
      rowEnd: number;
      price: number;
      name: string;
    }>;
    onPurchase: () => void;
    isProcessing: boolean;
    showBuyerForm: boolean;
    setShowBuyerForm: (show: boolean) => void;
    onSubmit: (buyerInfo: any) => Promise<void>;
  }
  
  export const PurchaseSummary = memo(function PurchaseSummary({
    selectedSeats,
    sections,
    isProcessing,
    showBuyerForm,
    setShowBuyerForm,
    onSubmit
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
            <Button
              className="w-full"
              disabled={selectedSeats.length === 0}
              onClick={() => setShowBuyerForm(true)}
            >
              Continuar con la compra
            </Button>
          )}
        </CardContent>
      </Card>
    );
  });