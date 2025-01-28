// src/components/credits/CustomCreditCalculator.tsx
'use client'

import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border-2 border-[#a5dcfd]"
    >
      <h3 className="font-['Bristol'] text-3xl text-[#032936] mb-8 text-center">
        Personaliza tu Compra
      </h3>
      
      <div className="flex items-center justify-center gap-8 mb-8">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => adjustCredits(-10)}
          className="w-12 h-12 rounded-full bg-[#032936] text-white flex items-center justify-center text-2xl hover:bg-[#032936]/90"
          disabled={credits < 10}
        >
          -
        </motion.button>
        
        <input
          type="number"
          value={credits}
          onChange={handleInputChange}
          className="w-32 text-center text-3xl font-bold text-[#032936] bg-[#a5dcfd]/20 rounded-lg p-4 border-2 border-[#a5dcfd] focus:outline-none focus:ring-2 focus:ring-[#a5dcfd]"
          min="0"
        />
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => adjustCredits(10)}
          className="w-12 h-12 rounded-full bg-[#032936] text-white flex items-center justify-center text-2xl hover:bg-[#032936]/90"
        >
          +
        </motion.button>
      </div>

      <div className="space-y-6 bg-[#a5dcfd]/10 p-6 rounded-xl">
        <div className="flex justify-between text-lg">
          <span className="text-[#032936]">Precio por crédito:</span>
          <span className="font-bold text-[#032936]">${CREDIT_PRICE.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-xl font-bold">
          <span className="text-[#032936]">Total:</span>
          <span className="text-[#ff3131]">${totalPrice.toLocaleString()}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePurchase}
          disabled={credits <= 0}
          className="w-full py-4 bg-[#ff3131] text-white rounded-xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff3131]/90 transition-colors"
        >
          Comprar {credits} créditos
        </motion.button>
      </div>
    </motion.div>
  );
}

export { CustomCreditCalculator };

