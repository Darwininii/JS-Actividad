import { FiExternalLink, FiHeart, FiInfo } from 'react-icons/fi'
import { DONATION_URL } from '../constants/links'
import Boton from './Boton'

/**
 * Barra inferior de la tarjeta con el acceso a créditos y enlace de donaciones.
 */
export default function FooterBar({ onOpenCredits }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-300/15 bg-[#0e0c1f]/70 px-4 py-2.5 sm:px-5">
      <Boton
        variant="link"
        size="inline"
        onClick={onOpenCredits}
      >
        <FiInfo className="text-indigo-300" />
        Créditos
      </Boton>

      <Boton
        variant="donation"
        size="xs"
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Un equipo digno para no rendirme: Ayúdame a seguir programando mi futuro - #VakiPower"
      >
        <FiHeart className="text-amber-300" />
        Donaciones
        <FiExternalLink className="text-[10px] opacity-80" />
      </Boton>
    </footer>
  )
}
