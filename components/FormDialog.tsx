'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Si true, permite cerrar con Escape (p. ej. diálogos de solo lectura). */
  allowEscapeClose?: boolean
}

/**
 * Diálogo de formulario: no se cierra al hacer clic fuera ni al pulsar Escape por defecto.
 * El cierre debe hacerse con botones explícitos (Guardar / Cancelar / Cerrar).
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  allowEscapeClose = false,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(className)}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (!allowEscapeClose) e.preventDefault()
        }}
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
