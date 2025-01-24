'use client'

import { PackageList } from '@/components/credits/PackageList';
import { CustomCreditCalculator } from '@/components/credits/CustomCreditCalculator';
import { CreditBalance } from '@/components/credits/CreditBalance';

function CreditsPage() {
  return (
    <div className="container mx-auto p-8">
      {/* Título Principal */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
        <span className="text-[#FF5F1F]">Gestión</span> de Créditos
      </h1>

      {/* Balance de Créditos */}
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8 w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Balance de Créditos</h2>
        <CreditBalance />
      </div>

      {/* Paquetes Predefinidos */}
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8 w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Paquetes Predefinidos</h2>
        <PackageList />
      </div>

      {/* Compra Personalizada */}
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8 w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Compra Personalizada</h2>
        <CustomCreditCalculator />
      </div>
    </div>
  );
}

export default CreditsPage;