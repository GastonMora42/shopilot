'use client'

import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

export const CreditBalance = () => {
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      const data = await response.json();
      setBalanceData(data);
    } catch (err) {
      setError('Error al cargar el balance');
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center text-gray-600">Cargando balance...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!balanceData) return <div className="text-center text-gray-600">No hay datos disponibles</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border-2 border-[#a5dcfd]"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-['Bristol'] text-3xl text-[#032936]">Balance Actual</h2>
        <div className="bg-[#a5dcfd] px-6 py-3 rounded-full">
          <span className="text-2xl font-bold text-[#032936]">
            {balanceData?.balance || 0} créditos
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#032936] mb-4">Últimas Transacciones</h3>
        {balanceData?.transactions?.slice(0, 5).map((transaction: any, index: number) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-[#a5dcfd]/10 transition-colors"
          >
            <span className="text-[#032936] font-medium">{transaction.type}</span>
            <span className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-[#ff3131]'}`}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount} créditos
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
