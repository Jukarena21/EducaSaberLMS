"use client"

import { useEffect, useRef } from "react"

type ParticleBackgroundProps = {
  particleCount?: number
  className?: string
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

export function ParticleBackground({ particleCount = 45, className = "" }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    const createParticle = (): Particle => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0005,
      vy: (Math.random() - 0.5) * 0.0005,
      radius: 0.2 + Math.random() * 0.6,
      opacity: 0.25 + Math.random() * 0.35,
    })

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const { offsetWidth, offsetHeight } = canvas

      canvas.width = offsetWidth * dpr
      canvas.height = offsetHeight * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      particles = Array.from({ length: particleCount }, createParticle)
    }

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1

        const px = p.x * width
        const py = p.y * height

        const gradient = ctx.createRadialGradient(px, py, 0, px, py, p.radius * 120)
        gradient.addColorStop(0, `rgba(115, 162, 211, ${p.opacity})`)
        gradient.addColorStop(1, "transparent")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(px, py, p.radius * 60, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(draw)
    }

    resizeCanvas()
    draw()

    const handleResize = () => resizeCanvas()
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [particleCount])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 w-full h-full opacity-80 mix-blend-screen ${className}`}
    />
  )
}

