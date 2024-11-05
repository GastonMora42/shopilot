// components/ui/sheet.tsx
'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export function Sheet({
  children,
  open,
  onOpenChange
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  )
}

export function SheetTrigger({ children }: { children: React.ReactNode }) {
  return <Dialog.Trigger asChild>{children}</Dialog.Trigger>
}

export function SheetContent({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className={`fixed right-0 top-0 h-full w-[400px] bg-white p-6 shadow-lg ${className}`}>
        {children}
        <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

export function SheetHeader({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`space-y-2 ${className}`}>{children}</div>
}

export function SheetTitle({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Dialog.Title className={`text-lg font-semibold ${className}`}>
      {children}
    </Dialog.Title>
  )
}

export function SheetDescription({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Dialog.Description className={`text-sm text-gray-500 ${className}`}>
      {children}
    </Dialog.Description>
  )
}

export function SheetClose({ children }: { children: React.ReactNode }) {
  return <Dialog.Close asChild>{children}</Dialog.Close>
}