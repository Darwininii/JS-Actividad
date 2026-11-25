import { useEffect } from 'react'
import {
  FiExternalLink,
  FiGlobe,
  FiHeart,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { DONATION_URL, WEBSITE_URL } from '../constants/links'
import Boton from './Boton'

/**
 * Diálogo modal con la información del autor, detalles del proyecto y enlaces.
 */
export default function CreditsDialog({ open, onClose }) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-dialog-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-indigo-300/25 bg-[#121026] shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center justify-between border-b border-indigo-300/15 bg-[#0e0c1f]/90 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
              <FiUser className="text-base" />
            </div>
            <div>
              <h2 id="credits-dialog-title" className="text-sm font-semibold text-white">
                Créditos del proyecto
              </h2>
            </div>
          </div>

          <Boton
            variant="ghost"
            size="xs"
            onClick={onClose}
            aria-label="Cerrar diálogo de créditos"
            title="Cerrar"
          >
            <FiX className="text-base" />
          </Boton>
        </div>

        <div className="space-y-4 p-5 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
          <div className="rounded-xl border border-indigo-300/15 bg-[#0b0a1a]/90 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">Darwin Niño</span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
                Ingeniero de Sistemas · Desarrollador Web
              </span>
            </div>
            <p className="text-slate-300">
              Soy Darwin Niño, Ingeniero de Sistemas y desarrollador web. Hice esta
              aplicación para una actividad específica del SENA y la iré modificando
              cuando lo requiera. Todo el mundo la puede usar libremente y cualquier
              sugerencia es bienvenida.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-indigo-300/15 bg-white/3 p-3">
              <p className="font-medium text-slate-200">Entorno aislado</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Ejecución segura en Web Worker con límite de tiempo.
              </p>
            </div>
            <div className="rounded-xl border border-indigo-300/15 bg-white/3 p-3">
              <p className="font-medium text-slate-200">Consola integrada</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Soporte para console.log, console.table y prompt().
              </p>
            </div>
            <div className="rounded-xl border border-indigo-300/15 bg-white/3 p-3">
              <p className="font-medium text-slate-200">Atajos rápidos</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Ctrl + Enter para ejecutar y Ctrl + Z / Y para deshacer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-indigo-300/15 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Boton
                variant="secondary"
                size="md"
                href={WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiGlobe className="text-indigo-300" />
                Visitar mi web
                <FiExternalLink className="text-[11px] text-slate-400" />
              </Boton>

              <Boton
                variant="donation"
                size="md"
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Un equipo digno para no rendirme: Ayúdame a seguir programando mi futuro - #VakiPower"
              >
                <FiHeart className="text-amber-300" />
                Donaciones
                <FiExternalLink className="text-[11px] text-amber-300/70" />
              </Boton>
            </div>

            <Boton variant="primary" size="md" onClick={onClose}>
              Cerrar
            </Boton>
          </div>
        </div>
      </div>
    </div>
  )
}
