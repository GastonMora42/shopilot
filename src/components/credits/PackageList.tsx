// src/components/credits/PackageList.tsx
'use client'

import { useState, useEffect } from 'react';

function PackageList() {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/credits/packages');
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError('Error al cargar los paquetes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });
      
      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err) {
      console.error('Error purchasing credits:', err);
    }
  };

  if (isLoading) return <div>Cargando paquetes...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {packages.map((pkg) => (
        <div key={pkg._id} className="border p-4 rounded-lg">
          <h3 className="text-xl font-bold">{pkg.name}</h3>
          <p className="text-lg">{pkg.credits} créditos</p>
          <p className="text-xl font-bold">${pkg.price}</p>
          <button
            onClick={() => handlePurchase(pkg._id)}
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Comprar
          </button>
        </div>
      ))}
    </div>
  );
}

export { PackageList };