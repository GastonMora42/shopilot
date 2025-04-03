"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

const DialogDemo = () => (
  <Dialog.Root>
    <Dialog.Trigger asChild>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Open Dialog</button>
    </Dialog.Trigger>
    
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-md shadow-lg">
        <Dialog.Title className="text-lg font-bold">Dialog Title</Dialog.Title>
        <Dialog.Description className="mt-2 text-gray-600">
          Dialog Description
        </Dialog.Description>

        {/* Content goes here */}
        <div className="mt-4">
          Content...
        </div>

        <Dialog.Close asChild>
          <button 
            className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
)

export {
  Dialog,
  DialogDemo
}
