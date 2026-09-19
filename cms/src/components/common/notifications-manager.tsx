"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { getDonaciones, getMensajes } from "@/lib/data-store"

// ─── Web Audio Chimes ────────────────────────────────────────────────────────
export function playDonationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12) // E6
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start()
    osc1.stop(ctx.currentTime + 0.4)

    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(1760, ctx.currentTime) // A6
      osc2.frequency.exponentialRampToValueAtTime(2637.02, ctx.currentTime + 0.15) // E7
      gain2.gain.setValueAtTime(0.35, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start()
      osc2.stop(ctx.currentTime + 0.5)
    }, 100)
  } catch (e) {
    console.log("[Audio] Playback prevented:", e)
  }
}

export function playMessageChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch (e) {
    console.log("[Audio] Playback prevented:", e)
  }
}

// ─── Native Notification Trigger ─────────────────────────────────────────────
export async function sendLocalNotification(
  title: string,
  options: {
    body: string
    url?: string
    tag?: string
    icon?: string
  }
) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return
  }

  const notificationOpts = {
    body: options.body,
    icon: options.icon || "/favicon.svg",
    badge: "/favicon.svg",
    tag: options.tag || `altario-${Date.now()}`,
    data: { url: options.url || "/" },
    vibrate: [200, 100, 200],
  }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOpts)
        return
      }
    }
    new Notification(title, notificationOpts)
  } catch (err) {
    console.warn("[Notification] Could not show native notification:", err)
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function NotificationsManager() {
  const swRegRef = React.useRef<ServiceWorkerRegistration | null>(null)
  const notifiedKeysRef = React.useRef<Set<string>>(new Set())

  // Load already notified keys to avoid duplicate alerts
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("altario_notified_events_v1")
      if (raw) notifiedKeysRef.current = new Set(JSON.parse(raw))
    } catch (_) {}
  }, [])

  const markNotified = (key: string) => {
    notifiedKeysRef.current.add(key)
    try {
      const arr = Array.from(notifiedKeysRef.current).slice(-300)
      localStorage.setItem("altario_notified_events_v1", JSON.stringify(arr))
    } catch (_) {}
  }

  // 1. Register Service Worker
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        swRegRef.current = reg
        console.log("[PWA] Service Worker registered successfully")
      })
      .catch((err) => console.warn("[PWA] SW registration failed:", err))
  }, [])

  // 2. Realtime & Polling Listener for New Events
  React.useEffect(() => {
    let isInitialLoad = true

    const checkNewEvents = async () => {
      try {
        // A. Check Donaciones
        const donaciones = await getDonaciones()
        for (const d of donaciones) {
          const key = `donacion-${d.id}`
          if (!notifiedKeysRef.current.has(key)) {
            if (!isInitialLoad) {
              markNotified(key)
              playDonationChime()
              const donor = d.nombre_donante || "Donante anónimo"
              const monto = `$ ${Number(d.monto).toLocaleString("es-UY")}`
              sendLocalNotification(`Nueva Donación: ${monto}`, {
                body: `${donor} ha realizado una donación (${d.tipo === "mensual" ? "Mensual" : "Puntual"}).`,
                url: "/donaciones",
                tag: key,
              })
              window.dispatchEvent(new CustomEvent("refresh_donaciones"))
            } else {
              notifiedKeysRef.current.add(key)
            }
          }
        }

        // B. Check Mensajes
        const mensajes = await getMensajes()
        for (const m of mensajes) {
          const key = `mensaje-${m.id}`
          if (!notifiedKeysRef.current.has(key)) {
            if (!isInitialLoad) {
              markNotified(key)
              if (!m.leido) {
                playMessageChime()
                sendLocalNotification(`Nuevo Mensaje de Contacto`, {
                  body: `${m.nombre}: ${m.motivo || "Nueva consulta web"}`,
                  url: "/mensajes",
                  tag: key,
                })
                window.dispatchEvent(new CustomEvent("refresh_mensajes"))
              }
            } else {
              notifiedKeysRef.current.add(key)
            }
          }
        }

        if (isInitialLoad) {
          isInitialLoad = false
        }
      } catch (err) {
        console.warn("[Notifications] Error checking events:", err)
      }
    }

    // Initial check
    checkNewEvents()

    // Interval poll every 25 seconds
    const interval = setInterval(checkNewEvents, 25000)

    // Listen to Supabase Realtime if available
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null
    if (supabase) {
      channel = supabase
        .channel("altario-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "donaciones" },
          (payload) => {
            const d = payload.new as { id: string; monto: number; nombre_donante?: string; tipo?: string }
            const key = `donacion-${d.id}`
            if (!notifiedKeysRef.current.has(key)) {
              markNotified(key)
              playDonationChime()
              const donor = d.nombre_donante || "Donante anónimo"
              const monto = `$ ${Number(d.monto).toLocaleString("es-UY")}`
              sendLocalNotification(`Nueva Donación: ${monto}`, {
                body: `${donor} ha realizado una donación.`,
                url: "/donaciones",
                tag: key,
              })
              window.dispatchEvent(new CustomEvent("refresh_donaciones"))
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "mensajes_contacto" },
          (payload) => {
            const m = payload.new as { id: string; nombre: string; motivo?: string }
            const key = `mensaje-${m.id}`
            if (!notifiedKeysRef.current.has(key)) {
              markNotified(key)
              playMessageChime()
              sendLocalNotification(`Nuevo Mensaje de Contacto`, {
                body: `${m.nombre}: ${m.motivo || "Nueva consulta web"}`,
                url: "/mensajes",
                tag: key,
              })
              window.dispatchEvent(new CustomEvent("refresh_mensajes"))
            }
          }
        )
        .subscribe()
    }

    return () => {
      clearInterval(interval)
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  // Runs only in background — no UI
  return null
}
