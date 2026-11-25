import { FiCode } from 'react-icons/fi'
import CodeEditor from './CodeEditor'

/**
 * Panel izquierdo con cabecera de archivo, contador de líneas y editor de código.
 */
export default function EditorPanel({ code, onChange, onRun }) {
  const lineCount = Math.max(1, code.split('\n').length)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
          <FiCode className="text-indigo-400" />
          main.js
        </span>
        <span>
          {lineCount} {lineCount === 1 ? 'línea' : 'líneas'} · Ctrl + Enter para ejecutar
        </span>
      </div>

      <div className="h-[400px] sm:h-[460px]">
        <CodeEditor value={code} onChange={onChange} onRun={onRun} />
      </div>
    </div>
  )
}
