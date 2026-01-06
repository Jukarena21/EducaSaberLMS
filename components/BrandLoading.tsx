"use client"

import Image from "next/image"

interface BrandLoadingProps {
  message?: string
}

export function BrandLoading({ message }: BrandLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-200/60 via-sky-200/60 to-emerald-200/60 blur-xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="logo-orbit">
              <Image
                src="/logo-educasaber.png"
                alt="Educa-Saber"
                width={160}
                height={160}
                className="object-contain drop-shadow-xl"
                priority
              />
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-medium tracking-wide">
            {message || "Cargando plataforma Educa-Saber..."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Preparando tu experiencia personalizada
          </p>
        </div>
      </div>
    </div>
  )
}


