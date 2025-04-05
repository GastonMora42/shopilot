// CustomCreditCalculator.tsx
'use client'
import { Card } from '@/components/ui/Card'
import { Calculator, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react';

const CREDIT_PRICE = 189.99;

export function CustomCreditCalculator() {
 const [credits, setCredits] = useState<number>(0);
 const [totalPrice, setTotalPrice] = useState<number>(0);

 useEffect(() => {
   setTotalPrice(Number((credits * CREDIT_PRICE).toFixed(2)));
 }, [credits]);

 const handlePurchase = async () => {
  if (credits <= 0) return;
  try {
    const response = await fetch('/api/credits/purchase/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credits })
    });
    const data = await response.json();
    // Verificar si la respuesta contiene la URL de checkout
    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      console.error('Error: No se recibió la URL de checkout');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

 return (
   <Card className="bg-gradient-to-br from-purple-50 to-white">
     <div className="p-6">
       <div className="flex items-center justify-between mb-6">
         <div>
           <h2 className="text-sm font-medium text-purple-600">Compra los creditos que quieras</h2>
           <div className="flex items-center gap-4 mt-4">
             <button
               onClick={() => setCredits(Math.max(0, credits - 10))}
               className="bg-purple-100 text-purple-600 p-2 rounded-lg hover:bg-purple-200"
             >
               -10
             </button>
             <input
               type="number"
               value={credits}
               onChange={(e) => setCredits(Math.max(0, parseInt(e.target.value) || 0))}
               className="w-24 text-center bg-white border border-purple-200 rounded-lg p-2"
               min="0"
             />
             <button
               onClick={() => setCredits(credits + 10)}
               className="bg-purple-100 text-purple-600 p-2 rounded-lg hover:bg-purple-200"
             >
               +10
             </button>
           </div>
         </div>
         <Calculator className="h-12 w-12 text-purple-400" />
       </div>

       <div className="space-y-4 bg-white/50 rounded-lg p-4">
         <div className="flex justify-between items-center">
           <span className="text-purple-600">Precio por crédito</span>
           <span className="font-bold">${CREDIT_PRICE}</span>
         </div>
         <div className="flex justify-between items-center text-lg font-bold">
           <span className="text-purple-600">Total</span>
           <span>${totalPrice.toLocaleString()}</span>
         </div>
       </div>

       <button
         onClick={handlePurchase}
         disabled={credits <= 0}
         className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
       >
         Comprar {credits} créditos
       </button>
     </div>
   </Card>
 );
}