/**
 * Renderiza salidas de console.table() para arreglos y objetos.
 */
export default function ConsoleTable({ data }) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-slate-400">[] (tabla vacía)</span>
    }

    const isObjectRows = data.every((row) => row && typeof row === 'object' && !Array.isArray(row))
    const columns = isObjectRows
      ? Array.from(new Set(data.flatMap((row) => Object.keys(row))))
      : Array.isArray(data[0])
        ? data[0].map((_, i) => i)
        : ['Valor']

    return (
      <div className="my-1.5 overflow-x-auto rounded-lg border border-indigo-400/20 bg-[#0d0c1d]">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-indigo-400/20 bg-indigo-500/10 text-indigo-200">
              <th className="px-2.5 py-1.5 font-semibold text-slate-400">#</th>
              {columns.map((col) => (
                <th key={String(col)} className="px-2.5 py-1.5 font-semibold">
                  {String(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-indigo-400/10 last:border-none">
                <td className="px-2.5 py-1 text-slate-500">{rIdx}</td>
                {columns.map((col) => {
                  const cell = isObjectRows
                    ? row[col]
                    : Array.isArray(row)
                      ? row[col]
                      : row
                  return (
                    <td key={String(col)} className="px-2.5 py-1 text-slate-200">
                      {cell === undefined ? '—' : String(cell)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const entries = Object.entries(data || {})
  return (
    <div className="my-1.5 overflow-x-auto rounded-lg border border-indigo-400/20 bg-[#0d0c1d]">
      <table className="w-full border-collapse text-left font-mono text-xs">
        <thead>
          <tr className="border-b border-indigo-400/20 bg-indigo-500/10 text-indigo-200">
            <th className="px-2.5 py-1.5 font-semibold">Clave</th>
            <th className="px-2.5 py-1.5 font-semibold">Valor</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-b border-indigo-400/10 last:border-none">
              <td className="px-2.5 py-1 text-slate-300">{k}</td>
              <td className="px-2.5 py-1 text-slate-200">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
