import { useCallback, useEffect, useRef, useState } from 'react'
import { runJavaScriptInSandbox } from '../utils/codeRunner'

/**
 * Hook que gestiona la ejecución en sandbox, registros de consola,
 * detención de procesos e ingreso interactivo para prompt().
 */
export function useJsRunner({ code, inputs, onChangeInputs }) {
  const [logs, setLogs] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(null)
  const [pendingPrompt, setPendingPrompt] = useState(null)

  const stopRef = useRef(null)
  const interactiveInputsRef = useRef([])
  const latestRef = useRef({ code, inputs })

  useEffect(() => {
    latestRef.current = { code, inputs }
  }, [code, inputs])

  useEffect(() => {
    return () => {
      if (stopRef.current) {
        stopRef.current({ silent: true })
        stopRef.current = null
      }
    }
  }, [])

  const stop = useCallback((options) => {
    if (stopRef.current) {
      stopRef.current(options)
      stopRef.current = null
    }
    setIsRunning(false)
  }, [])

  const clearConsole = useCallback(() => {
    interactiveInputsRef.current = []
    setLogs([])
    setElapsedMs(null)
    setPendingPrompt(null)
  }, [])

  const runWithInputs = useCallback((extraInteractiveInputs = [], { ignoreManualInputs = false } = {}) => {
    if (stopRef.current) {
      stopRef.current({ silent: true })
      stopRef.current = null
    }

    const { code: currentCode, inputs: manualInputsText } = latestRef.current
    const manualInputs =
      ignoreManualInputs || manualInputsText === '' ? [] : manualInputsText.split('\n')
    const combinedInputs = [...manualInputs, ...extraInteractiveInputs]

    setLogs([])
    setElapsedMs(null)
    setPendingPrompt(null)
    setIsRunning(true)

    stopRef.current = runJavaScriptInSandbox({
      code: currentCode,
      inputs: combinedInputs,
      onLog: (entry) => {
        setLogs((prev) => [...prev, { kind: 'log', ...entry }])
      },
      onTable: (data) => {
        setLogs((prev) => [...prev, { kind: 'table', data }])
      },
      onClear: () => {
        setLogs([])
      },
      onNeedInput: (message) => {
        stopRef.current = null
        setIsRunning(false)
        setPendingPrompt(message)
      },
      onDone: (ms) => {
        stopRef.current = null
        setIsRunning(false)
        setElapsedMs(ms)
      },
      onError: (text, ms) => {
        stopRef.current = null
        setIsRunning(false)
        setElapsedMs(ms || null)
        setLogs((prev) => [...prev, { kind: 'log', level: 'error', text }])
      },
    })
  }, [])

  const execute = useCallback(
    ({ clearInputs = false } = {}) => {
      interactiveInputsRef.current = []
      if (clearInputs) {
        latestRef.current.inputs = ''
        onChangeInputs?.('')
      }
      runWithInputs([], { ignoreManualInputs: clearInputs })
    },
    [onChangeInputs, runWithInputs]
  )

  const submitPrompt = useCallback(
    (value) => {
      const nextInteractive = [...interactiveInputsRef.current, value]
      interactiveInputsRef.current = nextInteractive
      runWithInputs(nextInteractive)
    },
    [runWithInputs]
  )

  return {
    logs,
    isRunning,
    elapsedMs,
    pendingPrompt,
    execute,
    stop,
    clearConsole,
    submitPrompt,
  }
}
