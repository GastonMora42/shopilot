// components/ui/card.tsx
import { cn } from "@/app/lib/utils";
import { ReactNode } from "react"; // Importar ReactNode

interface CardProps {
  className?: string;  // className opcional
  children: ReactNode; // Permitir hijos de tipo ReactNode
  [key: string]: any;  // Esto permite otras propiedades no tipadas
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white shadow-sm",
        className
      )}
      {...props}
    >
      {children} {/* Renderizar los hijos */}
    </div>
  );
}
