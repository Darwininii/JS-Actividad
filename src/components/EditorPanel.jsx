import { useState } from 'react'
import { FiCode } from 'react-icons/fi'
import Boton from './Boton'
import CodeEditor from './CodeEditor'

/**
 * Panel izquierdo con cabecera de archivo, contador de líneas y editor de código.
 */
export default function EditorPanel({ code, onChange, onRun }) {
  const [wordWrap, setWordWrap] = useState(false)
  const lineCount = Math.max(1, code.split('\n').length)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
          <FiCode className="text-indigo-400" />
          main.js
        </span>
        <div className="flex items-center gap-2">
          <Boton
            variant="chip"
            size="xs"
            active={wordWrap}
            onClick={() => setWordWrap((v) => !v)}
            title="Alternar ajuste de línea (Alt + Z)"
          >
            Ajuste (Alt+Z)
          </Boton>
          <span>
            {lineCount} {lineCount === 1 ? 'línea' : 'líneas'} · Ctrl + Enter
          </span>
        </div>
      </div>

      <div className="h-[400px] sm:h-[460px]">
        <CodeEditor
          value={code}
          onChange={onChange}
          onRun={onRun}
          wordWrap={wordWrap}
          onToggleWordWrap={() => setWordWrap((v) => !v)}
        />
      </div>
    </div>
  )
}
