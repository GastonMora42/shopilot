'use client'
import { Card } from '@/components/ui/Card'
import { Package } from 'lucide-react'
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CreditPackage {
 _id: string;
 name: string;
 credits: number;
 price: number;
 isActive: boolean;
}

const PACKAGE_IMAGES = {
 'Starter': '/credits/10off.png',
 'Profesional': '/credits/21off.png',
 'Enterprise': '/credits/42off.png',
 'default': '/credits/off-creditos.png'
} as const;

export function PackageList() {
 const [packages, setPackages] = useState<CreditPackage[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

 useEffect(() => {
   fetchPackages();
 }, []);

 const fetchPackages = async () => {
   try {
     setIsLoading(true);
     setError(null);
     
     const response = await fetch('/api/credits/packages');
     const data = await response.json();
     
     // Verificar que data es un array
     if (Array.isArray(data)) {
       setPackages(data);
     } else if (data.packages && Array.isArray(data.packages)) {
       // Si la API devuelve un objeto con una propiedad "packages"
       setPackages(data.packages);
     } else {
       console.error('Formato de respuesta inesperado:', data);
       setError('Error: La respuesta del servidor no tiene el formato esperado');
       setPackages([]); // Establecer un array vacío como fallback
     }
   } catch (error) {
     console.error('Error al cargar paquetes:', error);
     setError('Error al cargar los paquetes. Por favor, intenta de nuevo más tarde.');
     setPackages([]); // Establecer un array vacío como fallback
   } finally {
     setIsLoading(false);
   }
 };

 const handlePurchase = async (packageId: string) => {
  try {
    setSelectedPackage(packageId);
    const response = await fetch('/api/credits/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId })
    });
    const data = await response.json();
    // Redireccionar al checkout de MercadoPago
    if (data.init_point) window.location.href = data.init_point;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setSelectedPackage(null);
  }
};

 const getPackageImage = (name: string): string => {
   return PACKAGE_IMAGES[name as keyof typeof PACKAGE_IMAGES] || PACKAGE_IMAGES.default;
 };

 if (isLoading) {
   return <div className="p-8 text-center text-gray-500">Cargando paquetes...</div>;
 }

 if (error) {
   return <div className="p-8 text-center text-red-500">{error}</div>;
 }

 if (!packages.length) {
   return <div className="p-8 text-center text-gray-500">No hay paquetes disponibles</div>;
 }

 return (
  <div className="space-y-6">
  {packages.map((pkg) => (
    <Card key={pkg._id} className="bg-gradient-to-br from-[#a5dcfd]/20 to-white overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-[#0087ca]">{pkg.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold">{pkg.credits} créditos</span>
              <Package className="h-5 w-5 text-[#0087ca]" />
            </div>
          </div>
          {/* Aumentando el tamaño del contenedor de la imagen */}
          <div className="relative h-32 w-32 rounded-lg overflow-hidden group">
            <Image
              src={getPackageImage(pkg.name)}
              alt={pkg.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>
           <div className="flex items-center justify-between">
             <span className="text-2xl font-bold text-[#0087ca]">
               ${pkg.price.toLocaleString()}
             </span>
             <button
               onClick={() => handlePurchase(pkg._id)}
               disabled={selectedPackage === pkg._id}
               className="bg-[#0087ca] text-white px-6 py-2 rounded-lg hover:bg-[#0087ca]/90 disabled:opacity-50"
             >
               {selectedPackage === pkg._id ? (
                 <div className="flex items-center gap-2">
                   <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                   Procesando...
                 </div>
               ) : (
                 'Comprar'
               )}
             </button>
           </div>
         </div>
       </Card>
     ))}
   </div>
 );
}