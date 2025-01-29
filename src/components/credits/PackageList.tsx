'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from "@/components/ui/Button";

// Tipos
interface CreditPackage {
  _id: string;
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
}

// Constantes
const PACKAGE_IMAGES = {
  'Starter': '/credits/10off.png',
  'Profesional': '/credits/21off.png', 
  'Enterprise': '/credits/42off.png',
  'default': '/credits/off-creditos.png'
} as const;

const fadeInUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 }
};

function PackageList() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/credits/packages');
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError('Error al cargar los paquetes');
      console.error('Error fetching packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handlePurchase = async (packageId: string) => {
    try {
      setSelectedPackage(packageId);
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });

      if (!response.ok) throw new Error('Error en la compra');
      
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err) {
      console.error('Error purchasing credits:', err);
    } finally {
      setSelectedPackage(null);
    }
  };

  const getPackageImage = (name: string): string => {
    return PACKAGE_IMAGES[name as keyof typeof PACKAGE_IMAGES] || PACKAGE_IMAGES.default;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#032936]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <Button 
          onClick={fetchPackages}
          className="bg-[#032936] hover:bg-[#032936]/90 text-white"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="font-['Bristol'] text-5xl text-[#032936] mb-4">
          Paquetes <span className="text-[#ff3131]">Disponibles</span>
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Selecciona el paquete que mejor se adapte a tus necesidades
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {packages.map((pkg, index) => (
            <motion.article
              key={pkg._id}
              {...fadeInUpVariants}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105"
              whileHover={{ y: -5 }}
            >
              <div className="relative h-48 group">
                <Image
                  src={getPackageImage(pkg.name)}
                  alt={`Paquete ${pkg.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  priority={index < 3}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-2xl font-bold">{pkg.name}</h3>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-3xl font-bold text-[#032936]">
                      {pkg.credits.toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-2">créditos</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Precio</span>
                    <div className="text-2xl font-bold text-[#ff3131]">
                      ${pkg.price.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(pkg._id)}
                  disabled={selectedPackage === pkg._id}
                  className={`
                    w-full py-4 rounded-xl font-bold text-white
                    transition-all duration-300
                    ${selectedPackage === pkg._id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#032936] hover:bg-[#032936]/90'
                    }
                  `}
                >
                  {selectedPackage === pkg._id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2" />
                      Procesando...
                    </div>
                  ) : (
                    'Comprar Ahora'
                  )}
                </motion.button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export { PackageList };