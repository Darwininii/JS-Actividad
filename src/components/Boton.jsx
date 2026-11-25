const VARIANT_CLASSES = {
  primary:
    'bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400',
  secondary:
    'border border-indigo-300/20 bg-white/5 font-medium text-slate-200 hover:bg-white/10',
  danger:
    'bg-rose-500 font-semibold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400',
  ghost: 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
  chip: 'font-medium bg-white/5 text-slate-400 hover:text-slate-200',
  'chip-active':
    'font-medium bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30',
  'link-danger': 'text-slate-400 hover:text-rose-300',
}

const SIZE_CLASSES = {
  md: 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs',
  'md-wide': 'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs',
  sm: 'inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs',
  xs: 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]',
  'xs-tight': 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]',
  inline: 'text-[11px]',
}

/**
 * Componente reutilizable de botón que centraliza variantes, tamaños y cursor-pointer.
 */
export default function Boton({
  children,
  variant = 'secondary',
  size = 'md',
  active = false,
  type = 'button',
  className = '',
  ...props
}) {
  const resolvedVariant = variant === 'chip' && active ? 'chip-active' : variant
  const variantClass = VARIANT_CLASSES[resolvedVariant] || VARIANT_CLASSES.secondary
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

  return (
    <button
      type={type}
      className={`cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
