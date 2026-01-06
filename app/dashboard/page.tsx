"use client"

import { useAuthRedirect } from "@/hooks/useAuthRedirect"
import { BrandLoading } from "@/components/BrandLoading"

export default function DashboardPage() {
  const { status } = useAuthRedirect()

  // Siempre mostramos el splash de marca mientras redirigimos según el rol.
  const message =
    status === "loading"
      ? "Redirigiendo a tu dashboard..."
      : "Preparando tu dashboard..."

  return <BrandLoading message={message} />
}
