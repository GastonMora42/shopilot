// src/components/credits/CustomCreditCalculator.tsx
'use client'

import { useState, useEffect } from 'react';

const CREDIT_PRICE = 149.50;

function CustomCreditCalculator() {
  const [credits, setCredits] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    setTotalPrice(Number((credits * CREDIT_PRICE).toFixed(2)));
  }, [credits]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    setCredits(value);
  };

  const adjustCredits = (amount: number) => {
    setCredits(prev => Math.max(0, prev + amount));
  };

  const handlePurchase = async () => {
    if (credits <= 0) return;

    try {
      const response = await fetch('/api/credits/purchase/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits, totalPrice })
      });
      
      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (error) {
      console.error('Error al procesar la compra:', error);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-4">Calculador de Créditos</h3>
      
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => adjustCredits(-10)}
          className="px-3 py-1 border rounded"
          disabled={credits < 10}
        >
          -10
        </button>
        
        <input
          type="number"
          value={credits}
          onChange={handleInputChange}
          className="w-24 px-3 py-2 border rounded text-center"
          min="0"
        />
        
        <button 
          onClick={() => adjustCredits(10)}
          className="px-3 py-1 border rounded"
        >
          +10
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-lg">
          <span>Precio por crédito:</span>
          <span>${CREDIT_PRICE.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-lg font-bold">
          <span>Total a pagar:</span>
          <span>${totalPrice.toLocaleString()}</span>
        </div>

        <button
          onClick={handlePurchase}
          disabled={credits <= 0}
          className="w-full py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        >
          Comprar {credits} créditos
        </button>
      </div>
    </div>
  );
}

export { CustomCreditCalculator };