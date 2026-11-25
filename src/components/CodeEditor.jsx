import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  deleteLines,
  duplicateLines,
  indentLines,
  moveLines,
  toggleLineComments,
} from '../utils/editorCommands'

const MAX_HISTORY = 200
const TYPING_COALESCE_MS = 500
const LINE_HEIGHT_PX = 24
const AUTO_PAIRS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
}
const CLOSING_CHARS = new Set(Object.values(AUTO_PAIRS))

/**
 * Editor de código ligero con numeración de líneas sincronizada,
 * ajuste de línea (Alt+Z), mover/duplicar/comentar/eliminar líneas,
 * autocompletado de pares, historial Undo/Redo (Ctrl+Z / Ctrl+Y)
 * y atajo Ctrl+Enter para ejecutar.
 */
export default function CodeEditor({
  value,
  onChange,
  onRun,
  wordWrap = false,
  onToggleWordWrap,
}) {
  const textareaRef = useRef(null)
  const gutterRef = useRef(null)
  const mirrorRef = useRef(null)

  const [lineHeights, setLineHeights] = useState(null)
  const [mirrorWidth, setMirrorWidth] = useState(0)

  const historyRef = useRef({
    stack: [{ value, start: 0, end: 0 }],
    index: 0,
    lastInputAt: 0,
  })
  const isApplyingHistoryRef = useRef(false)

  const lines = value.split('\n')

  // Sincronizar historial si `value` cambia externamente (ej. botón Reiniciar)
  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false
      return
    }
    const history = historyRef.current
    const current = history.stack[history.index]
    if (!current || current.value !== value) {
      historyRef.current = {
        stack: [{ value, start: value.length, end: value.length }],
        index: 0,
        lastInputAt: 0,
      }
    }
  }, [value])

  // Observar ancho del textarea cuando el ajuste de línea (Alt + Z) está activo
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || !wordWrap) return

    const updateWidth = () => {
      setMirrorWidth(textarea.clientWidth)
    }
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [wordWrap])

  // Medir la altura real de cada línea envuelta para mantener alineados los números
  useLayoutEffect(() => {
    if (!wordWrap || !mirrorRef.current) {
      setLineHeights(null)
      return
    }

    const heights = Array.from(mirrorRef.current.children).map((node) =>
      Math.max(LINE_HEIGHT_PX, node.getBoundingClientRect().height)
    )
    setLineHeights(heights)
  }, [value, wordWrap, mirrorWidth])

  const pushHistory = (nextValue, start, end, { coalesce = false } = {}) => {
    const history = historyRef.current
    const now = Date.now()
    const sliced = history.stack.slice(0, history.index + 1)

    if (
      coalesce &&
      sliced.length > 1 &&
      now - history.lastInputAt < TYPING_COALESCE_MS
    ) {
      sliced[sliced.length - 1] = { value: nextValue, start, end }
      historyRef.current = {
        stack: sliced,
        index: sliced.length - 1,
        lastInputAt: now,
      }
      return
    }

    const nextStack = [...sliced, { value: nextValue, start, end }]
    if (nextStack.length > MAX_HISTORY) {
      nextStack.shift()
    }

    historyRef.current = {
      stack: nextStack,
      index: nextStack.length - 1,
      lastInputAt: coalesce ? now : 0,
    }
  }

  const applyEdit = (nextValue, nextStart, nextEnd, options) => {
    isApplyingHistoryRef.current = true
    pushHistory(nextValue, nextStart, nextEnd, options)
    onChange(nextValue)
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.selectionStart = nextStart
        textarea.selectionEnd = nextEnd
      }
    })
  }

  const applyResult = (result) => {
    if (result) {
      applyEdit(result.value, result.start, result.end)
    }
  }

  const applySnapshot = (nextIndex) => {
    const history = historyRef.current
    const snapshot = history.stack[nextIndex]
    if (!snapshot) return

    history.index = nextIndex
    history.lastInputAt = 0
    isApplyingHistoryRef.current = true
    onChange(snapshot.value)

    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.selectionStart = snapshot.start
        textarea.selectionEnd = snapshot.end
      }
    })
  }

  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleChange = (e) => {
    const textarea = e.target
    const nextValue = textarea.value
    const start = textarea.selectionStart ?? nextValue.length
    const end = textarea.selectionEnd ?? nextValue.length
    const isSingleCharInsert = Math.abs(nextValue.length - value.length) === 1

    isApplyingHistoryRef.current = true
    pushHistory(nextValue, start, end, { coalesce: isSingleCharInsert })
    onChange(nextValue)
  }

  const handleKeyDown = (e) => {
    const hasMod = e.ctrlKey || e.metaKey
    const textarea = textareaRef.current

    // Ejecutar código (Ctrl + Enter / Cmd + Enter)
    if (hasMod && (e.key === 'Enter' || e.code === 'NumpadEnter')) {
      e.preventDefault()
      e.stopPropagation()
      onRun?.()
      return
    }

    // Deshacer (Ctrl + Z / Cmd + Z)
    if (hasMod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (historyRef.current.index > 0) {
        applySnapshot(historyRef.current.index - 1)
      }
      return
    }

    // Rehacer (Ctrl + Y / Ctrl + Shift + Z / Cmd + Shift + Z)
    if (
      hasMod &&
      !e.altKey &&
      ((e.shiftKey && e.key.toLowerCase() === 'z') || (!e.shiftKey && e.key.toLowerCase() === 'y'))
    ) {
      e.preventDefault()
      if (historyRef.current.index < historyRef.current.stack.length - 1) {
        applySnapshot(historyRef.current.index + 1)
      }
      return
    }

    // Alternar ajuste de línea / Word Wrap (Alt + Z)
    if (e.altKey && !hasMod && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      onToggleWordWrap?.()
      return
    }

    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Mover o duplicar líneas (Alt + Flecha Arriba / Abajo, Alt + Shift + Flecha Arriba / Abajo)
    if (e.altKey && !hasMod && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      const direction = e.key === 'ArrowUp' ? -1 : 1
      applyResult(
        e.shiftKey
          ? duplicateLines(value, start, end, direction)
          : moveLines(value, start, end, direction)
      )
      return
    }

    // Comentar / descomentar línea o selección (Ctrl + / o Cmd + /)
    if (hasMod && !e.altKey && e.key === '/') {
      e.preventDefault()
      applyResult(toggleLineComments(value, start, end))
      return
    }

    // Eliminar línea actual o seleccionada (Ctrl + Shift + K)
    if (hasMod && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      applyResult(deleteLines(value, start, end))
      return
    }

    // Indentar / desindentar (Tab / Shift + Tab)
    if (e.key === 'Tab') {
      e.preventDefault()
      applyResult(indentLines(value, start, end, e.shiftKey))
      return
    }

    // Salto de línea con auto-indentación
    if (e.key === 'Enter') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const currentLine = value.slice(lineStart, start)
      const indentMatch = currentLine.match(/^\s*/)
      const baseIndent = indentMatch ? indentMatch[0] : ''
      const extraIndent = currentLine.trimEnd().endsWith('{') ? '  ' : ''

      if (baseIndent || extraIndent) {
        e.preventDefault()
        const insertion = '\n' + baseIndent + extraIndent
        const next = value.slice(0, start) + insertion + value.slice(end)
        const caret = start + insertion.length
        applyEdit(next, caret, caret)
      }
      return
    }

    // Autocompletar pares de paréntesis, corchetes, llaves y comillas
    if (!hasMod && !e.altKey && AUTO_PAIRS[e.key]) {
      const openChar = e.key
      const closeChar = AUTO_PAIRS[openChar]
      const nextChar = value[end]

      if (start !== end) {
        e.preventDefault()
        const selected = value.slice(start, end)
        const next = value.slice(0, start) + openChar + selected + closeChar + value.slice(end)
        applyEdit(next, start + 1, end + 1)
        return
      }

      if (openChar === closeChar && nextChar === closeChar) {
        e.preventDefault()
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1
        })
        return
      }

      const isQuote = openChar === '"' || openChar === "'" || openChar === '`'
      const canWrapEmpty = !isQuote || !nextChar || /[\s)\]}.,;:]/.test(nextChar)
      if (canWrapEmpty) {
        e.preventDefault()
        const next = value.slice(0, start) + openChar + closeChar + value.slice(end)
        applyEdit(next, start + 1, start + 1)
      }
      return
    }

    // Saltar sobre carácter de cierre si ya está justo delante del cursor
    if (!hasMod && !e.altKey && start === end && CLOSING_CHARS.has(e.key) && value[start] === e.key) {
      e.preventDefault()
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      })
      return
    }

    // Borrar el par completo si se presiona Backspace entre () [] {} "" '' ``
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prevChar = value[start - 1]
      const nextChar = value[start]
      if (AUTO_PAIRS[prevChar] && AUTO_PAIRS[prevChar] === nextChar) {
        e.preventDefault()
        const next = value.slice(0, start - 1) + value.slice(start + 1)
        applyEdit(next, start - 1, start - 1)
      }
    }
  }

  return (
    <div className="relative flex h-full min-h-85 w-full overflow-hidden rounded-xl border border-indigo-400/15 bg-[#0b0a1a]/90 font-mono text-[13.5px] leading-6">
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden border-r border-indigo-400/10 bg-[#080716]/80 px-3 py-3.5 text-right text-xs leading-6 text-slate-500"
      >
        {lines.map((_, idx) => (
          <div
            key={idx + 1}
            style={
              wordWrap && lineHeights && lineHeights[idx]
                ? { height: `${lineHeights[idx]}px` }
                : undefined
            }
          >
            {idx + 1}
          </div>
        ))}
      </div>

      {wordWrap && (
        <div
          ref={mirrorRef}
          aria-hidden="true"
          style={{ width: mirrorWidth || '100%' }}
          className="pointer-events-none invisible fixed top-0 left-0 -z-10 px-4 py-3.5 font-mono text-[13.5px] leading-6 whitespace-pre-wrap wrap-break-word"
        >
          {lines.map((line, idx) => (
            <div key={idx}>{line || '\u00A0'}</div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label="Editor de código JavaScript"
        placeholder="// Escribe tu código JavaScript aquí..."
        className={`h-full w-full resize-none bg-transparent px-4 py-3.5 font-mono text-[13.5px] leading-6 text-slate-100 placeholder:text-slate-600 focus:outline-none ${wordWrap
            ? 'overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-word'
            : 'overflow-auto whitespace-pre'
          }`}
      />
    </div>
  )
}
