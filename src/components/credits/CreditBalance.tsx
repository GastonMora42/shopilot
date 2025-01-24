'use client'

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
    <div className="p-8 border border-gray-300 rounded-lg shadow-lg bg-white max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800">Tu Balance</h2>
      <p className="text-4xl font-semibold text-blue-600 mt-4">{balanceData.balance} créditos</p>
      
      <h3 className="text-lg font-medium text-gray-700 mt-6">Últimas transacciones</h3>
      <div className="mt-4">
        {balanceData.transactions?.slice(0, 5).map((transaction: any, index: number) => (
          <div key={index} className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-gray-600">{transaction.type}</span>
            <span className="font-medium text-gray-800">{transaction.amount} créditos</span>
          </div>
        ))}
      </div>
    </div>
  );
};