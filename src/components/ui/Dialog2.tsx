// components/ui/Dialog2.tsx
import { Dialog } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Dialog2Props {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

export function Dialog2({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = 'info',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = true
}: Dialog2Props) {
  
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    error: <XCircle className="h-6 w-6 text-red-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    info: <AlertCircle className="h-6 w-6 text-[#7C3AED]" />
  }

  const styles = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500', 
    warning: 'border-l-4 border-yellow-500',
    info: 'border-l-4 border-[#7C3AED]'
  }

  const buttonStyles = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-[#7C3AED] hover:bg-[#6D28D9]'
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`
            bg-white rounded-lg shadow-xl 
            max-w-md w-full mx-auto
            ${styles[type]}
          `}
        >
          {/* Header */}
          <div className="p-6">
            <div className="flex gap-4">
              {icons[type]}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                {description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            {showCancel && (
              <Button
                variant="outline"
                onClick={onClose}
                className="hover:bg-gray-100"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={onConfirm || onClose}
              className={buttonStyles[type]}
            >
              {confirmText}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
