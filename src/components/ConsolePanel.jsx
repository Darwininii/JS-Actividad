import { useEffect, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiCornerDownLeft,
  FiInfo,
  FiTerminal,
  FiTrash2,
} from 'react-icons/fi'
import Boton from './Boton'
import ConsoleTable from './ConsoleTable'

const LOG_STYLE_MAP = {
  error: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  warn: 'text-amber-200 bg-amber-500/10 border-amber-500/20',
  prompt: 'text-indigo-200 bg-indigo-500/10 border-indigo-400/20',
  result: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
}

function renderLogIcon(level) {
  if (level === 'error') return <FiAlertCircle className="mt-0.5 shrink-0 text-rose-400" />
  if (level === 'warn') return <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-400" />
  if (level === 'info') return <FiInfo className="mt-0.5 shrink-0 text-sky-400" />
  if (level === 'prompt') return <FiCornerDownLeft className="mt-0.5 shrink-0 text-indigo-400" />
  if (level === 'result') return <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-400" />
  return <span className="mt-0.5 shrink-0 select-none text-indigo-400/70">&gt;</span>
}

/**
 * Panel derecho con la consola de salida, entradas predefinidas y prompt interactivo.
 */
export default function ConsolePanel({
  logs,
  isRunning,
  elapsedMs,
  inputs,
  pendingPrompt,
  onChangeInputs,
  onClearConsole,
  onSubmitPrompt,
}) {
  const [showInputsBox, setShowInputsBox] = useState(false)
  const [promptValue, setPromptValue] = useState('')
  const promptInputRef = useRef(null)

  useEffect(() => {
    if (pendingPrompt && promptInputRef.current) {
      promptInputRef.current.focus()
    }
  }, [pendingPrompt])

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = promptValue
    setPromptValue('')
    onSubmitPrompt(value)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            <FiTerminal className="text-emerald-400" />
            Consola
          </span>
          {elapsedMs !== null && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-400">
              {elapsedMs} ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Boton
            variant="chip"
            size="xs"
            active={Boolean(showInputsBox || inputs)}
            onClick={() => setShowInputsBox((v) => !v)}
          >
            Entradas (prompt)
            {showInputsBox ? <FiChevronUp /> : <FiChevronDown />}
          </Boton>
          <Boton
            variant="ghost"
            size="xs-tight"
            onClick={onClearConsole}
            title="Limpiar consola"
          >
            <FiTrash2 />
            Limpiar
          </Boton>
        </div>
      </div>

      {showInputsBox && (
        <div className="rounded-xl border border-indigo-400/20 bg-[#0b0a1a]/90 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Valores para cada llamada a prompt() (uno por línea):</span>
            {inputs && (
              <Boton
                variant="link-danger"
                size="inline"
                onClick={() => onChangeInputs('')}
              >
                Vaciar
              </Boton>
            )}
          </div>
          <textarea
            value={inputs}
            onChange={(e) => onChangeInputs(e.target.value)}
            rows={3}
            placeholder="Un valor por línea..."
            className="w-full resize-y rounded-lg border border-indigo-400/15 bg-[#080716] px-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-400/40 focus:outline-none"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-indigo-400/15 bg-[#0b0a1a]/90 font-mono text-[13px]">
        <div className="flex-1 space-y-1.5 overflow-y-auto p-3.5" style={{ minHeight: 280, maxHeight: 460 }}>
          {logs.length === 0 && !pendingPrompt && !isRunning && (
            <div className="flex h-full min-h-65 flex-col items-center justify-center text-center text-xs text-slate-500">
              <FiTerminal className="mb-2 text-xl text-slate-600" />
              <p>Pulsa &quot;Ejecutar&quot; para ver la salida aquí.</p>
              <p className="mt-1 text-[11px] text-slate-600">
                Soporta console.log, console.table y prompt().
              </p>
            </div>
          )}

          {logs.map((item, idx) => {
            if (item.kind === 'table') {
              return <ConsoleTable key={idx} data={item.data} />
            }

            const colorClass = LOG_STYLE_MAP[item.level] || 'text-slate-200 border-transparent'
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-md border px-2 py-1 leading-relaxed wrap-break-word whitespace-pre-wrap ${colorClass}`}
              >
                {renderLogIcon(item.level)}
                <span className="min-w-0 flex-1">{item.text}</span>
              </div>
            )
          })}

          {isRunning && (
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-indigo-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
              Ejecutando...
            </div>
          )}

          {pendingPrompt && (
            <form
              onSubmit={handleSubmit}
              className="mt-2 rounded-lg border border-indigo-400/35 bg-indigo-500/10 p-2.5"
            >
              <label className="mb-1.5 block text-xs font-medium text-indigo-200">
                prompt: {pendingPrompt}
              </label>
              <div className="flex gap-2">
                <input
                  ref={promptInputRef}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Escribe el valor y pulsa Enter..."
                  className="flex-1 rounded-md border border-indigo-400/30 bg-[#080716] px-2.5 py-1 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none"
                />
                <Boton
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="shadow-none"
                >
                  Enviar
                </Boton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
