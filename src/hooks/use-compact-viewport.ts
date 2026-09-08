import { useEffect, useState } from 'react'

/** O mesmo `md` do Tailwind, porque é ele que decide a sidebar. */
const COMPACTO = '(max-width: 767px)'

/**
 * Se a tela é estreita o bastante pra a navegação e o layout mudarem de forma.
 *
 * É decisão de JS e não de CSS porque o que muda não é aparência: no celular a
 * Home deixa de ser uma grade do `react-grid-layout` e vira empilhamento. Isso
 * é outro componente, não outro estilo.
 *
 * `matchMedia` e não `innerWidth`: o navegador avisa quando o casamento muda,
 * sem precisar escutar `resize` e recalcular a cada pixel arrastado.
 *
 * O primeiro render responde `false` de propósito — `window` não existe no
 * Electron antes do `whenReady` nem num SSR futuro, e o desktop é o default
 * que a seção 1 do design system chama de lente principal.
 */
export function useCompactViewport(): boolean {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(COMPACTO)
    const apply = () => setCompact(query.matches)

    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  return compact
}
