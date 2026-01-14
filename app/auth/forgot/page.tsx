"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { ParticleBackground } from "@/components/ParticleBackground"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(null)
    setError(null)

    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No pudimos procesar tu solicitud")
      }

      setSuccess(
        "Si tu correo está registrado, hemos enviado una contraseña temporal. Revisa tu bandeja de entrada y spam."
      )
    } catch (err: any) {
      setError(err?.message || "No pudimos procesar tu solicitud. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#dfe9ff] via-[#e8f0ff] to-[#d8e6ff]">
        <ParticleBackground />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />
        </div>

        <div className="flex items-center justify-center min-h-screen px-4 relative z-10 py-12">
          <Card className="w-full max-w-xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#4667ac] to-[#c00102] py-6 px-6 flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                <Image
                  src="/logo-educasaber.png"
                  alt="EducaSaber"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-center text-white">
                <h2 className="text-lg font-semibold">Recuperar contraseña</h2>
                <p className="text-sm text-white/80">Usa el mismo correo con el que te registraste</p>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {success && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…
                    </>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>
              </form>

              <div className="text-sm text-center text-gray-600">
                ¿Recuerdas tu contraseña?
                <Link href="/" className="text-[#C00102] font-semibold ml-2 hover:underline">
                  Volver a iniciar sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

