"use client"

import * as React from "react"
import {
  Root as Dialog,
  Trigger as DialogTrigger,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContentBase,
  Title as DialogTitle,
  Description as DialogDescription,
} from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// helper wrappers
export const DialogHeader = ({ children }: React.PropsWithChildren) => <div className="mb-4">{children}</div>

export const DialogFooter = ({ children }: React.PropsWithChildren) => (
  <div className="mt-6 flex justify-end space-x-2">{children}</div>
)

const AlertDialog = Dialog
const AlertDialogTrigger = DialogTrigger
const AlertDialogPortal = DialogPortal
const AlertDialogOverlay = DialogOverlay
const AlertDialogContent = DialogContentBase
const AlertDialogHeader = DialogHeader
const AlertDialogFooter = DialogFooter
const AlertDialogTitle = DialogTitle
const AlertDialogDescription = DialogDescription
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  return <Button className={className} {...props} ref={ref} />
})
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  return <Button variant="outline" className={className} {...props} ref={ref} />
})
AlertDialogCancel.displayName = "AlertDialogCancel"

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContentBase>,
  React.ComponentPropsWithoutRef<typeof DialogContentBase>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogContentBase
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    >
      {children}
    </DialogContentBase>
  </DialogPortal>
))
DialogContent.displayName = "DialogContent"

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  Dialog,
  DialogContent,
  DialogTitle,
}
