// components/ui/Toast.tsx (continuación)
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 left-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    >
      <div className="flex items-center gap-2">
        <p className="text-sm">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded-full"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}