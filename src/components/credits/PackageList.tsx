'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

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

  if (isLoading) return <div className="text-center text-gray-600">Cargando paquetes...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Paquetes de Créditos</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {packages.map((pkg) => (
          <Card
            key={pkg._id}
            className="group bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-[300px] lg:w-[350px]"
          >
            <CardHeader className="p-0">
              <div className="relative aspect-w-4 aspect-h-4">
                <img
                  src={pkg.imageUrl || "/off-creditos.png"} // Imagen individual o predeterminada
                  alt={pkg.name}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="text-xl font-semibold text-gray-900">{pkg.name}</CardTitle>
              <CardDescription className="text-lg font-medium text-[#FF5F1F]">{pkg.credits} créditos</CardDescription>
              <p className="text-2xl font-bold text-gray-900">${pkg.price}</p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handlePurchase(pkg._id)}
                className="w-full bg-[#FF5F1F] text-white hover:bg-[#FF5F1F]/90 shadow-lg transition-colors"
              >
                Comprar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { PackageList };