
// CreditBalance.tsx
'use client'
import { Card } from '@/components/ui/Card'
import { Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { useState, useEffect } from 'react';

export const CreditBalance = () => {
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      const data = await response.json();
      setBalanceData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-[#a5dcfd]/20 to-white">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#0087ca]">Balance Actual</p>
            <h3 className="text-3xl font-bold mt-2">{balanceData?.balance || 0} créditos</h3>
          </div>
          <Wallet className="h-12 w-12 text-[#0087ca]" />
        </div>
        
        <div className="mt-6 space-y-4">
          {balanceData?.transactions?.slice(0, 3).map((transaction: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
              <div className="flex items-center gap-3">
                {transaction.amount > 0 ? (
                  <ArrowUpCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm font-medium">{transaction.type}</span>
              </div>
              <span className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};