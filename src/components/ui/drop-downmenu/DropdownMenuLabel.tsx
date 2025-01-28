// components/ui/dropdown-menu/DropdownMenuLabel.tsx
import React from 'react';

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuLabel({ children, className = '' }: DropdownMenuLabelProps) {
  return (
    <div className={`px-3 py-2 text-sm text-gray-700 font-medium ${className}`}>
      {children}
    </div>
  );
}