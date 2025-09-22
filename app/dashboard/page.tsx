"use client"
import { useAuthRedirect } from "@/hooks/useAuthRedirect"

export default function DashboardPage() {
  const { session, status } = useAuthRedirect()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#73A2D3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Esta página no debería renderizarse por mucho tiempo ya que useAuthRedirect
  // redirigirá automáticamente según el rol
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#73A2D3] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  )
} 