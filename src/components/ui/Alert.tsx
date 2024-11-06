// components/ui/alert.tsx
import { cn } from "@/app/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  showIcon?: boolean;
  onClose?: () => void;
}

const variants = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    content: 'text-green-700',
    Icon: CheckCircle2
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    content: 'text-red-700',
    Icon: XCircle
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-800',
    content: 'text-yellow-700',
    Icon: AlertCircle
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    content: 'text-blue-700',
    Icon: Info
  }
};

export function Alert({ 
  title, 
  children, 
  variant = 'info', 
  className,
  showIcon = true,
  onClose 
}: AlertProps) {
  const styles = variants[variant];
  const Icon = styles.Icon;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border relative",
        styles.container,
        className
      )}
      role="alert"
    >
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
        )}
        <div className={cn("flex-1", showIcon && "ml-3")}>
          {title && (
            <h3 className={cn("text-sm font-medium", styles.title)}>
              {title}
            </h3>
          )}
          <div className={cn("text-sm", styles.content, title && "mt-2")}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className={cn(
              "ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8",
              styles.icon,
              "hover:bg-opacity-10 hover:bg-black focus:outline-none"
            )}
            onClick={onClose}
          >
            <span className="sr-only">Cerrar</span>
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}