'use client'

// components/credits/CreditBalance.tsx
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

  if (isLoading) return <div>Cargando balance...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!balanceData) return <div>No hay datos disponibles</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Tu Balance</h2>
      <p className="text-3xl font-bold mt-2">{balanceData.balance} créditos</p>
      
      <h3 className="text-lg font-bold mt-4">Últimas transacciones</h3>
      <div className="mt-2">
        {balanceData.transactions?.slice(0, 5).map((transaction: any, index: number) => (
          <div key={index} className="flex justify-between py-2 border-b">
            <span>{transaction.type}</span>
            <span>{transaction.amount} créditos</span>
          </div>
        ))}
      </div>
    </div>
  );
};