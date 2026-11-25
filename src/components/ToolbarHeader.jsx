import { FiCheck, FiCopy, FiPlay, FiRotateCcw, FiSquare } from 'react-icons/fi'
import { SiJavascript } from 'react-icons/si'
import Boton from './Boton'

/**
 * Barra superior con el título y acciones principales (copiar, reiniciar, ejecutar/detener).
 */
export default function ToolbarHeader({
  copied,
  isRunning,
  onCopy,
  onReset,
  onRun,
  onStop,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-300/15 bg-[#0e0c1f]/80 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center text-amber-300">
          <SiJavascript className="text-2xl" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white sm:text-base">
            Ejecutor JavaScript
          </h1>
          <p className="text-xs text-slate-400">Modo libre</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Boton
          variant="secondary"
          size="md"
          onClick={onCopy}
          title="Copiar código"
        >
          {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy className="text-slate-300" />}
          <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
        </Boton>

        <Boton
          variant="secondary"
          size="md"
          onClick={onReset}
          title="Limpiar editor"
        >
          <FiRotateCcw className="text-slate-300" />
          <span className="hidden sm:inline">Reiniciar</span>
        </Boton>

        {isRunning ? (
          <Boton variant="danger" size="md-wide" onClick={onStop}>
            <FiSquare className="text-xs" />
            Detener
          </Boton>
        ) : (
          <Boton variant="primary" size="md-wide" onClick={onRun}>
            <FiPlay className="text-xs" />
            Ejecutar
          </Boton>
        )}
      </div>
    </header>
  )
}
