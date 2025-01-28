// components/ui/dropdown-menu/index.tsx
import * as React from "react"

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuItem({ 
  children, 
  className = '', 
  ...props 
}: DropdownMenuItemProps) {
  return (
    <div 
      className={`px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 ${className}`}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  )
}