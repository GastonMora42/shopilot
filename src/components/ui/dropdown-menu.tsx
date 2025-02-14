// components/ui/dropdown-menu.tsx
'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

export function DropdownMenu({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <DropdownMenuPrimitive.Root>
      {children}
    </DropdownMenuPrimitive.Root>
  )
}

export function DropdownMenuTrigger({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Trigger className={className} asChild>
      {children}
    </DropdownMenuPrimitive.Trigger>
  )
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'  // Hacemos el align opcional
  sideOffset?: number                  // También podemos hacer el sideOffset opcional
}

export function DropdownMenuContent({
  children,
  className = '',
  align = 'end',    // Valor por defecto 'end'
  sideOffset = 5    // Valor por defecto 5
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={`min-w-[8rem] rounded-md border bg-white p-1 shadow-md ${className}`}
        align={align}
        sideOffset={sideOffset}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Item
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 ${className}`}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}