"use client"

import { useEffect, useRef } from "react"

type Section = "video" | "theory" | "exercises"

const FLUSH_EVERY_MS = 60_000
// Leyendo o resolviendo ejercicios casi siempre hay scroll, clics o teclas.
const INACTIVITY_MS = 3 * 60_000
// Viendo un video el estudiante puede no tocar nada durante varios minutos,
// y el reproductor (iframe) no deja ver sus eventos. Solo aplica con el foco
// dentro del reproductor.
const VIDEO_INACTIVITY_MS = 30 * 60_000

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const

/**
 * Mide el tiempo activo en una lección (pestaña visible y con actividad
 * reciente) y lo reporta cada minuto y al salir. Si el envío falla, el tiempo
 * se conserva para el siguiente intento.
 */
export function useLessonStudyTime(lessonId: string | undefined, section: string, enabled: boolean) {
  const pendingRef = useRef<Record<Section, number>>({ video: 0, theory: 0, exercises: 0 })
  const lastActivityRef = useRef(Date.now())
  const sectionRef = useRef<Section>("video")

  useEffect(() => {
    if (section === "video" || section === "theory" || section === "exercises") {
      sectionRef.current = section
    }
    lastActivityRef.current = Date.now()
  }, [section])

  useEffect(() => {
    if (!lessonId || !enabled) return

    const url = `/api/student/lessons/${lessonId}/study-time`

    const takePending = () => {
      const entries = (Object.keys(pendingRef.current) as Section[])
        .filter((s) => pendingRef.current[s] > 0)
        .map((s) => ({ section: s, seconds: pendingRef.current[s] }))
      pendingRef.current = { video: 0, theory: 0, exercises: 0 }
      return entries
    }

    const restore = (entries: Array<{ section: Section; seconds: number }>) => {
      for (const e of entries) pendingRef.current[e.section] += e.seconds
    }

    const flush = () => {
      const entries = takePending()
      if (entries.length === 0) return
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
        keepalive: true,
      })
        .then((res) => {
          if (!res.ok) restore(entries)
        })
        .catch(() => restore(entries))
    }

    const flushOnExit = () => {
      const entries = takePending()
      if (entries.length === 0) return
      const body = new Blob([JSON.stringify({ entries })], { type: "application/json" })
      if (!navigator.sendBeacon?.(url, body)) {
        fetch(url, { method: "POST", body, keepalive: true }).catch(() => {})
      }
    }

    const markActive = () => {
      lastActivityRef.current = Date.now()
    }

    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return
      const current = sectionRef.current
      // Al dar play, el foco pasa al iframe del reproductor
      const watchingVideo = document.activeElement?.tagName === "IFRAME"
      const limit = watchingVideo ? VIDEO_INACTIVITY_MS : INACTIVITY_MS
      if (Date.now() - lastActivityRef.current > limit) return
      pendingRef.current[current] += 1
    }, 1000)

    const periodic = setInterval(flush, FLUSH_EVERY_MS)

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushOnExit()
      else markActive()
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActive, { passive: true, capture: true })
    )
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", flushOnExit)

    return () => {
      clearInterval(tick)
      clearInterval(periodic)
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActive, { capture: true })
      )
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", flushOnExit)
      flushOnExit()
    }
  }, [lessonId, enabled])
}
