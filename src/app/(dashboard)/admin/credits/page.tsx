// src/app/(dashboard)/admin/credits/page.tsx
'use client'

import { PackageList } from '@/components/credits/PackageList';
import { CustomCreditCalculator } from '@/components/credits/CustomCreditCalculator';
import { CreditBalance } from '@/components/credits/CreditBalance';

function CreditsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gestión de Créditos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Paquetes Predefinidos</h2>
          <PackageList />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Balance de creditos
          </h2>
          <CreditBalance />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Compra Personalizada</h2>
          <CustomCreditCalculator />
        </div>
      </div>
    </div>
  );
}

export default CreditsPage;