// src/components/credits/CustomCreditCalculator.tsx
'use client'

import { useState, useEffect } from 'react';

const CREDIT_PRICE = 189.99;

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
    <div className="p-8 border border-gray-300 rounded-lg shadow-lg bg-white max-w-md mx-auto">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">Calculador de Créditos</h3>
      
      <div className="flex items-center justify-center gap-6 mb-6">
        <button 
          onClick={() => adjustCredits(-10)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
          disabled={credits < 10}
        >
          -10
        </button>
        
        <input
          type="number"
          value={credits}
          onChange={handleInputChange}
          className="w-20 px-4 py-2 border rounded-lg text-center text-xl font-medium text-gray-800"
          min="0"
        />
        
        <button 
          onClick={() => adjustCredits(10)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
        >
          +10
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-lg text-gray-700">
          <span>Precio por crédito:</span>
          <span>${CREDIT_PRICE.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-lg font-semibold text-gray-800">
          <span>Total a pagar:</span>
          <span>${totalPrice.toLocaleString()}</span>
        </div>

        <button
          onClick={handlePurchase}
          disabled={credits <= 0}
          className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
        >
          Comprar {credits} créditos
        </button>
      </div>
    </div>
  );
}

export { CustomCreditCalculator };