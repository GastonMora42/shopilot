import { useEffect, useState } from "react";
import { SavedLayout, StorageService } from "../utils/storage";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";

// components/admin/EventForm/steps/SeatingMap/components/LoadLayoutModal.tsx
interface LoadLayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (layout: SavedLayout) => void;
  }
  
  export const LoadLayoutModal: React.FC<LoadLayoutModalProps> = ({
    isOpen,
    onClose,
    onLoad
  }) => {
    const [layouts, setLayouts] = useState<SavedLayout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      if (isOpen) {
        loadLayouts();
      }
    }, [isOpen]);
  
    const loadLayouts = async () => {
      try {
        setIsLoading(true);
        const savedLayouts = await StorageService.getLayouts();
        setLayouts(savedLayouts);
      } catch (error) {
        console.error('Error loading layouts:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Cargar Layout</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Cerrar</span>
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>
  
                {isLoading ? (
                  <div className="flex justify-center py-8">
                  </div>
                ) : layouts.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No hay layouts guardados
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {layouts.map((layout) => (
                      <motion.button
                        key={layout.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onLoad(layout)}
                        className="p-4 border rounded-lg text-left hover:border-blue-500"
                      >
                        <h4 className="font-medium">{layout.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {layout.metadata?.totalSeats} asientos
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Actualizado: {new Date(layout.updatedAt).toLocaleDateString()}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };