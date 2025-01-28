// CreditsPage.tsx
'use client'
import { PackageList } from '@/components/credits/PackageList';
import { CustomCreditCalculator } from '@/components/credits/CustomCreditCalculator';
import { CreditBalance } from '@/components/credits/CreditBalance';
import Image from 'next/image';

function CreditsPage() {
  return (
    // Wrapper principal que elimina cualquier margen heredado
    <div className="-mt-[64px] -ml-[226px] min-h-screen w-[calc(100%+256px)] bg-gradient-to-b from-[#a5dcfd]/20 to-white">
      {/* Contenedor del contenido con padding ajustado */}
      <div className="pl-[256px] pt-[64px]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header con Logo y Título */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12">
            <div className="w-[150px]">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={150} 
                height={50}
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl text-[#032936] text-center sm:text-right">
              Sistema de <span className="text-[#ff3131]">Créditos</span>
            </h1>
          </div>

          {/* Contenido */}
          <div className="space-y-12">
            <CreditBalance />
            <PackageList />
            <CustomCreditCalculator />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreditsPage;