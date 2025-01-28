// components/ui/dropdown-menu/DropdownMenuSeparator.tsx
import React from 'react';

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className = '' }: DropdownMenuSeparatorProps) {
  return (
    <div className={`h-px bg-gray-200 my-1 ${className}`} />
  );
}