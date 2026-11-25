import { useEffect, useState } from 'react'
import ConsolePanel from './components/ConsolePanel'
import EditorPanel from './components/EditorPanel'
import ToolbarHeader from './components/ToolbarHeader'
import { useJsRunner } from './hooks/useJsRunner'

const STORAGE_KEY = 'act-sena-js-runner-free-v1'
const DEFAULT_CODE = '// Escribe tu código JavaScript aquí\n'

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function App() {
  const [code, setCode] = useState(() => loadSavedState().code ?? DEFAULT_CODE)
  const [inputs, setInputs] = useState(() => loadSavedState().inputs ?? '')
  const [copied, setCopied] = useState(false)

  const {
    logs,
    isRunning,
    elapsedMs,
    pendingPrompt,
    execute,
    stop,
    clearConsole,
    submitPrompt,
  } = useJsRunner({
    code,
    inputs,
    onChangeInputs: setInputs,
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, inputs }))
    } catch {
      // Ignorar errores de cuota en localStorage
    }
  }, [code, inputs])

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.code === 'NumpadEnter')) {
        e.preventDefault()
        execute({ clearInputs: true })
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [execute])

  const handleReset = () => {
    if (isRunning) stop({ silent: true })
    setCode(DEFAULT_CODE)
    setInputs('')
    clearConsole()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Sin permiso de portapapeles
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
      <section className="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-indigo-300/20 bg-[#121026]/88 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <ToolbarHeader
          copied={copied}
          isRunning={isRunning}
          onCopy={handleCopy}
          onReset={handleReset}
          onRun={() => execute()}
          onStop={() => stop()}
        />

        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[1.25fr_1fr]">
          <EditorPanel
            code={code}
            onChange={setCode}
            onRun={() => execute({ clearInputs: true })}
          />

          <ConsolePanel
            logs={logs}
            isRunning={isRunning}
            elapsedMs={elapsedMs}
            inputs={inputs}
            pendingPrompt={pendingPrompt}
            onChangeInputs={setInputs}
            onClearConsole={clearConsole}
            onSubmitPrompt={submitPrompt}
          />
        </div>
      </section>
    </main>
  )
}
