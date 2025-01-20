"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

const DialogDemo = () => (
  <Dialog.Root>
    <Dialog.Trigger asChild>
      <button>Open Dialog</button>
    </Dialog.Trigger>
    
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md p-6 w-[90vw] max-w-md">
        <Dialog.Title className="text-lg font-bold">Dialog Title</Dialog.Title>
        <Dialog.Description className="mt-2 text-gray-600">
          Dialog Description
        </Dialog.Description>

        {/* Content goes here */}
        <div className="mt-4">
          Content...
        </div>

        <Dialog.Close asChild>
          <button className="absolute top-4 right-4">
            <X size={16} />
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