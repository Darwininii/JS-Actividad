import { useEffect, useRef } from 'react'

const MAX_HISTORY = 200
const TYPING_COALESCE_MS = 500

/**
 * Editor de código ligero con numeración de líneas sincronizada,
 * soporte de Tab/Shift+Tab, historial Undo/Redo (Ctrl+Z / Ctrl+Y)
 * y atajo Ctrl+Enter para ejecutar.
 */
export default function CodeEditor({ value, onChange, onRun }) {
  const textareaRef = useRef(null)
  const gutterRef = useRef(null)

  const historyRef = useRef({
    stack: [{ value, start: 0, end: 0 }],
    index: 0,
    lastInputAt: 0,
  })
  const isApplyingHistoryRef = useRef(false)

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

  const lineCount = Math.max(1, value.split('\n').length)

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

    const textarea = textareaRef.current
    if (!textarea) return

    if (e.key === 'Tab') {
      e.preventDefault()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      if (start === end && !e.shiftKey) {
        const next = value.slice(0, start) + '  ' + value.slice(end)
        applyEdit(next, start + 2, start + 2)
        return
      }

      // Indentar o desindentar líneas seleccionadas
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineEndIdx = value.indexOf('\n', end)
      const blockEnd = lineEndIdx === -1 ? value.length : lineEndIdx
      const selectedBlock = value.slice(lineStart, blockEnd)
      const lines = selectedBlock.split('\n')

      let deltaFirst = 0
      let deltaTotal = 0
      const updated = lines.map((line, idx) => {
        if (e.shiftKey) {
          const removeCount = line.startsWith('  ') ? 2 : line.startsWith('\t') ? 1 : 0
          if (idx === 0) deltaFirst = -removeCount
          deltaTotal -= removeCount
          return line.slice(removeCount)
        }
        if (idx === 0) deltaFirst = 2
        deltaTotal += 2
        return '  ' + line
      })

      const next = value.slice(0, lineStart) + updated.join('\n') + value.slice(blockEnd)
      const nextStart = Math.max(lineStart, start + deltaFirst)
      const nextEnd = Math.max(lineStart, end + deltaTotal)
      applyEdit(next, nextStart, nextEnd)
    } else if (e.key === 'Enter') {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
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
    }
  }

  return (
    <div className="relative flex h-full min-h-85 w-full overflow-hidden rounded-xl border border-indigo-400/15 bg-[#0b0a1a]/90 font-mono text-[13.5px] leading-6">
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden border-r border-indigo-400/10 bg-[#080716]/80 px-3 py-3.5 text-right text-xs leading-6 text-slate-500"
      >
        {Array.from({ length: lineCount }, (_, idx) => (
          <div key={idx + 1}>{idx + 1}</div>
        ))}
      </div>

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
        className="h-full w-full resize-none overflow-auto bg-transparent px-4 py-3.5 font-mono text-[13.5px] leading-6 whitespace-pre text-slate-100 placeholder:text-slate-600 focus:outline-none"
      />
    </div>
  )
}
