import { cn } from "@/app/lib/utils";
import { ReactNode } from "react"; // Importar ReactNode
import { HTMLProps } from "react"; // Importar HTMLProps

interface CardProps extends HTMLProps<HTMLDivElement> {
  className?: string;  // className opcional
  children: ReactNode; // Permitir hijos de tipo ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white shadow-sm",
        className
      )}
      {...props} // Se propagan todas las demás propiedades válidas para el div
    >
      {children} {/* Renderizar los hijos */}
    </div>
  );
}
