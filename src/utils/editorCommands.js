function getAffectedLineRange(value, start, end) {
  const lines = value.split('\n')
  const firstLine = value.slice(0, start).split('\n').length - 1
  const effectiveEnd = end > start && value[end - 1] === '\n' ? end - 1 : end
  const lastLine = value.slice(0, effectiveEnd).split('\n').length - 1

  let blockStart = 0
  for (let i = 0; i < firstLine; i++) {
    blockStart += lines[i].length + 1
  }

  let blockEnd = blockStart
  for (let i = firstLine; i <= lastLine; i++) {
    blockEnd += lines[i].length + (i < lastLine ? 1 : 0)
  }

  return { lines, firstLine, lastLine, blockStart, blockEnd }
}

function joinLinesWithOffsets(lines) {
  const offsets = []
  let pos = 0
  for (let i = 0; i < lines.length; i++) {
    offsets.push(pos)
    pos += lines[i].length + 1
  }
  return { text: lines.join('\n'), offsets }
}

/**
 * Mueve la línea actual o las líneas seleccionadas hacia arriba (-1) o abajo (+1).
 */
export function moveLines(value, start, end, direction) {
  const { lines, firstLine, lastLine } = getAffectedLineRange(value, start, end)

  if (direction < 0 && firstLine === 0) return null
  if (direction > 0 && lastLine === lines.length - 1) return null

  const oldOffsets = joinLinesWithOffsets(lines).offsets
  const startInBlock = start - oldOffsets[firstLine]
  const endInBlock = end - oldOffsets[firstLine]

  const nextLines = [...lines]
  if (direction < 0) {
    const above = nextLines[firstLine - 1]
    nextLines.splice(firstLine - 1, 1)
    nextLines.splice(lastLine, 0, above)
    const { text, offsets } = joinLinesWithOffsets(nextLines)
    const newBlockStart = offsets[firstLine - 1]
    return {
      value: text,
      start: newBlockStart + startInBlock,
      end: newBlockStart + endInBlock,
    }
  }

  const below = nextLines[lastLine + 1]
  nextLines.splice(lastLine + 1, 1)
  nextLines.splice(firstLine, 0, below)
  const { text, offsets } = joinLinesWithOffsets(nextLines)
  const newBlockStart = offsets[firstLine + 1]
  return {
    value: text,
    start: newBlockStart + startInBlock,
    end: newBlockStart + endInBlock,
  }
}

/**
 * Duplica la línea actual o el bloque seleccionado arriba (-1) o abajo (+1).
 */
export function duplicateLines(value, start, end, direction) {
  const { lines, firstLine, lastLine, blockStart, blockEnd } = getAffectedLineRange(
    value,
    start,
    end
  )
  const blockLines = lines.slice(firstLine, lastLine + 1)
  const blockCharSpan = blockEnd - blockStart + 1

  const nextLines = [...lines]
  nextLines.splice(lastLine + 1, 0, ...blockLines)
  const text = nextLines.join('\n')

  if (direction > 0) {
    return {
      value: text,
      start: start + blockCharSpan,
      end: end + blockCharSpan,
    }
  }

  return { value: text, start, end }
}

/**
 * Alterna comentarios de línea (//) en la línea actual o selección.
 */
export function toggleLineComments(value, start, end) {
  const { lines, firstLine, lastLine } = getAffectedLineRange(value, start, end)
  const targetIndices = []
  for (let i = firstLine; i <= lastLine; i++) {
    targetIndices.push(i)
  }

  const nonEmptyIndices = targetIndices.filter((i) => lines[i].trim().length > 0)
  const checkIndices = nonEmptyIndices.length > 0 ? nonEmptyIndices : targetIndices
  const allCommented = checkIndices.every((i) => /^\s*\/\//.test(lines[i]))

  const nextLines = [...lines]
  const deltas = new Map()

  if (allCommented) {
    for (const i of checkIndices) {
      const match = nextLines[i].match(/^(\s*)(\/\/\s?)/)
      if (match) {
        const removed = match[2].length
        nextLines[i] = match[1] + nextLines[i].slice(match[1].length + removed)
        deltas.set(i, -removed)
      }
    }
  } else {
    const minIndent = checkIndices.reduce((min, i) => {
      const indent = nextLines[i].match(/^\s*/)[0].length
      return Math.min(min, indent)
    }, Infinity)

    for (const i of checkIndices) {
      nextLines[i] =
        nextLines[i].slice(0, minIndent) + '// ' + nextLines[i].slice(minIndent)
      deltas.set(i, 3)
    }
  }

  let totalDeltaBeforeStart = 0
  let totalDeltaUpToEnd = 0
  for (let i = firstLine; i <= lastLine; i++) {
    const d = deltas.get(i) || 0
    if (i === firstLine) {
      totalDeltaBeforeStart += d
    }
    totalDeltaUpToEnd += d
  }

  const { text, offsets } = joinLinesWithOffsets(nextLines)
  return {
    value: text,
    start: Math.max(offsets[firstLine], start + totalDeltaBeforeStart),
    end: Math.max(offsets[firstLine], end + totalDeltaUpToEnd),
  }
}

/**
 * Elimina la línea actual o todas las líneas dentro de la selección.
 */
export function deleteLines(value, start, end) {
  const { lines, firstLine, lastLine } = getAffectedLineRange(value, start, end)
  const nextLines = [...lines]
  nextLines.splice(firstLine, lastLine - firstLine + 1)

  if (nextLines.length === 0) {
    return { value: '', start: 0, end: 0 }
  }

  const { text, offsets } = joinLinesWithOffsets(nextLines)
  const targetLine = Math.min(firstLine, nextLines.length - 1)
  const caret = offsets[targetLine]
  return { value: text, start: caret, end: caret }
}

/**
 * Indenta o desindenta con 2 espacios la selección o línea actual.
 */
export function indentLines(value, start, end, unindent) {
  if (start === end && !unindent) {
    return {
      value: value.slice(0, start) + '  ' + value.slice(end),
      start: start + 2,
      end: start + 2,
    }
  }

  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEndIdx = value.indexOf('\n', end)
  const blockEnd = lineEndIdx === -1 ? value.length : lineEndIdx
  const lines = value.slice(lineStart, blockEnd).split('\n')

  let deltaFirst = 0
  let deltaTotal = 0
  const updated = lines.map((line, idx) => {
    if (unindent) {
      const removeCount = line.startsWith('  ') ? 2 : line.startsWith('\t') ? 1 : 0
      if (idx === 0) deltaFirst = -removeCount
      deltaTotal -= removeCount
      return line.slice(removeCount)
    }
    if (idx === 0) deltaFirst = 2
    deltaTotal += 2
    return '  ' + line
  })

  return {
    value: value.slice(0, lineStart) + updated.join('\n') + value.slice(blockEnd),
    start: Math.max(lineStart, start + deltaFirst),
    end: Math.max(lineStart, end + deltaTotal),
  }
}
