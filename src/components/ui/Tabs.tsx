// components/ui/Tabs.tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/app/lib/utils"

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      className={cn("w-full", className)}
      {...props}
    />
  )
}

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1",
        className
      )}
      {...props}
    />
  )
}

export interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  value: string;
}

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5",
        "text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  value: string;
}

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "mt-2 ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}