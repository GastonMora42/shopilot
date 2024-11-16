// components/ui/Modal.tsx
import { ReactNode, useEffect } from 'react';
import { cn } from '@/app/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeydown);
    } else {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeydown);
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden',
        !isOpen && 'hidden'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-lg",
          "w-[95vw] max-h-[90vh]", 
          "flex flex-col",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn(
      "flex justify-between items-center px-6 py-4 border-b",
      "flex-shrink-0", // Evita que el header se encoja
      className
    )}>
      {children}
    </div>
  );
}

export function ModalContent({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn(
      "flex-1 overflow-auto p-4",
      "min-h-0", // Importante para el scroll
      className
    )}>
      <div className="min-w-fit"> {/* Asegura que el contenido no se encoja */}
        {children}
      </div>
    </div>
  );
}

export function ModalFooter({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn(
      "border-t px-6 py-4",
      "flex-shrink-0", // Evita que el footer se encoja
      "bg-white", // Asegura que el footer sea visible sobre el contenido
      className
    )}>
      {children}
    </div>
  );
}