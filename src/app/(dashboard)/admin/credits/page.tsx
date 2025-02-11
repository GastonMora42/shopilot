// CreditsPage.tsx
'use client'
import { PackageList } from '@/components/credits/PackageList';
import { CustomCreditCalculator } from '@/components/credits/CustomCreditCalculator';
import { CreditBalance } from '@/components/credits/CreditBalance';
import Image from 'next/image';

function CreditsPage() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Créditos</h1>
          <div className="h-10 w-px bg-gray-200"></div>
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-20 md:h-24 lg:h-28 w-auto object-contain"
          />
        </div>
        <p className="text-gray-500 mt-2">
          Gestiona y adquiere créditos para tus eventos
        </p>
      </div>

      <div className="space-y-6">
        <CreditBalance />
        <div className="grid md:grid-cols-2 gap-6">
          <PackageList />
          <CustomCreditCalculator />
        </div>
      </div>
    </div>
  );
}

export default CreditsPage;
