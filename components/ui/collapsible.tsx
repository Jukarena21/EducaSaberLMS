"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cn } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = ({ className, ...props }: CollapsiblePrimitive.CollapsibleContentProps) => (
  <CollapsiblePrimitive.CollapsibleContent
    className={cn(
      "overflow-hidden text-sm data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
      className
    )}
    {...props}
  />
)

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
