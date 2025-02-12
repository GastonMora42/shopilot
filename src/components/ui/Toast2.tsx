import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";

// components/ui/Toast2.tsx
export function Toast2({ message, type = 'info', onClose }: {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose?: () => void;
  }) {
    const icons = {
      success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      error: <XCircle className="h-5 w-5 text-red-600" />,
      warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      info: <AlertCircle className="h-5 w-5 text-[#7C3AED]" />
    }
  
    const styles = {
      success: 'border-l-4 border-green-500 bg-green-50',
      error: 'border-l-4 border-red-500 bg-red-50',
      warning: 'border-l-4 border-yellow-500 bg-yellow-50',
      info: 'border-l-4 border-[#7C3AED] bg-purple-50'
    }
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`
          fixed bottom-4 right-4 z-50
          max-w-md rounded-lg shadow-lg
          ${styles[type]}
        `}
      >
        <div className="p-4 flex items-start gap-3">
          {icons[type]}
          <p className="text-sm text-gray-700 flex-1">{message}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </motion.div>
    )
  }