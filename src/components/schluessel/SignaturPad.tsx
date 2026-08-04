'use client'

// Handgerolltes Unterschriften-Feld (Canvas, Pointer Events) — funktioniert
// mit Finger, Stift und Maus. touch-action: none verhindert, dass iOS Safari
// beim Unterschreiben scrollt; devicePixelRatio-Skalierung hält die Linie
// auf Retina-Displays scharf. Export als PNG-DataURL.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface SignaturPadHandle {
  getDataUrl: () => string | null // null solange leer
  clear: () => void
}

export const SignaturPad = forwardRef<SignaturPadHandle, { className?: string }>(
  function SignaturPad({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const [hasInk, setHasInk] = useState(false)
    const hasInkRef = useRef(false)

    useEffect(() => {
      const c = canvasRef.current
      if (!c) return
      const dpr = window.devicePixelRatio || 1
      const r = c.getBoundingClientRect()
      c.width = r.width * dpr
      c.height = r.height * dpr
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#1f2937'
      ctxRef.current = ctx

      let drawing = false
      const down = (e: PointerEvent) => {
        drawing = true
        c.setPointerCapture(e.pointerId)
        const b = c.getBoundingClientRect()
        ctx.beginPath()
        ctx.moveTo(e.clientX - b.left, e.clientY - b.top)
      }
      const move = (e: PointerEvent) => {
        if (!drawing) return
        const b = c.getBoundingClientRect()
        ctx.lineTo(e.clientX - b.left, e.clientY - b.top)
        ctx.stroke()
        if (!hasInkRef.current) {
          hasInkRef.current = true
          setHasInk(true)
        }
      }
      const up = () => {
        drawing = false
      }
      c.addEventListener('pointerdown', down)
      c.addEventListener('pointermove', move)
      c.addEventListener('pointerup', up)
      c.addEventListener('pointercancel', up)
      return () => {
        c.removeEventListener('pointerdown', down)
        c.removeEventListener('pointermove', move)
        c.removeEventListener('pointerup', up)
        c.removeEventListener('pointercancel', up)
      }
    }, [])

    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        const c = canvasRef.current
        if (!c || !hasInkRef.current) return null
        return c.toDataURL('image/png')
      },
      clear: () => {
        const c = canvasRef.current
        const ctx = ctxRef.current
        if (c && ctx) ctx.clearRect(0, 0, c.width, c.height)
        hasInkRef.current = false
        setHasInk(false)
      },
    }))

    return (
      <div className={`border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative ${className ?? ''}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-40 block rounded-lg"
          style={{ touchAction: 'none' }}
        />
        {!hasInk && (
          <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none">
            hier unterschreiben
          </span>
        )}
      </div>
    )
  },
)
