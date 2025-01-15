import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { memo, useState } from "react";
import Image from 'next/image';
import { X } from "lucide-react";

  // Componente de imagen del evento optimizado
export const EventImage = memo(function EventImage({ 
    imageUrl, 
    eventName 
  }: { 
    imageUrl: string; 
    eventName: string; 
  }) {
    const [imageLoading, setImageLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <>
        <motion.div
          className="relative w-full h-[400px] overflow-hidden rounded-t-lg cursor-pointer"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onClick={() => setShowModal(true)}
        >
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-t-lg" />
          )}
          <motion.div
            className="relative w-full h-full"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={imageUrl}
              alt={`Imagen de ${eventName}`}
              fill
              className={`object-cover rounded-t-lg transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw"
              onLoadingComplete={() => setImageLoading(false)}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isHovered ? 1 : 0.8 }}
                  className="bg-white/20 backdrop-blur-sm p-3 rounded-full"
                >
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
  
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-4xl max-h-[90vh] w-full"
                onClick={e => e.stopPropagation()}
              >
                <Image
                  src={imageUrl}
                  alt={`Imagen de ${eventName}`}
                  width={1200}
                  height={800}
                  className="object-contain w-full h-full rounded-lg"
                />
                <button
                  className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
                  onClick={() => setShowModal(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  });