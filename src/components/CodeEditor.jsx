import { useRef } from 'react'

/**
 * Editor de código ligero con numeración de líneas sincronizada,
 * soporte de Tab/Shift+Tab y atajo Ctrl+Enter para ejecutar.
 */
export default function CodeEditor({ value, onChange, onRun }) {
  const textareaRef = useRef(null)
  const gutterRef = useRef(null)

  const lineCount = Math.max(1, value.split('\n').length)

  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.code === 'NumpadEnter')) {
      e.preventDefault()
      e.stopPropagation()
      onRun?.()
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
        onChange(next)
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        })
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
      onChange(next)
      requestAnimationFrame(() => {
        textarea.selectionStart = Math.max(lineStart, start + deltaFirst)
        textarea.selectionEnd = Math.max(lineStart, end + deltaTotal)
      })
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
        onChange(next)
        requestAnimationFrame(() => {
          const caret = start + insertion.length
          textarea.selectionStart = textarea.selectionEnd = caret
        })
      }
    }
  }

  return (
    <div className="relative flex h-full min-h-[340px] w-full overflow-hidden rounded-xl border border-indigo-400/15 bg-[#0b0a1a]/90 font-mono text-[13.5px] leading-6">
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
        onChange={(e) => onChange(e.target.value)}
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
