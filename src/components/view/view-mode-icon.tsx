import type { ViewMode } from '@/domain/library-view'

/**
 * Os quatro ícones de modo de exibição. Cada um é o LAYOUT em miniatura — o
 * desenho é o próprio resultado, não uma metáfora dele: três linhas para a
 * lista compacta, linha com miniatura para a lista, nove quadrados pequenos
 * para a grade compacta, quatro grandes para a grade.
 *
 * É o que permite o gatilho do menu mostrar o modo atual sem escrever o nome
 * dele — como o "Recentes ▦" do Spotify, de onde a anatomia veio.
 *
 * **Saiu de `library/` em 04/09/2026**, onde nasceu porque `/library` foi a
 * primeira tela a ter modos. Três arquivos de `piles/` já o importavam, e
 * componente que atravessa domínio não pode morar dentro de um deles — a pasta
 * passa a mentir sobre a quem ele pertence. Vai pra `view/` pelo mesmo padrão
 * que `menu/` já segue: pasta nomeada pela COISA, não pelo domínio, quando a
 * coisa é de todo mundo.
 *
 * Ele desenha os QUATRO modos porque o vocabulário é um só — `PILE_VIEW_MODES`
 * é um subconjunto declarado de `ViewMode`, não uma segunda lista.
 */
const PATHS: Record<ViewMode, React.ReactNode> = {
  'compact-list': <path d="M3 5.5h14M3 10h14M3 14.5h14" />,
  list: (
    <>
      <rect x="2.5" y="4" width="4" height="4" rx="1.2" />
      <path d="M8.5 6h9" />
      <rect x="2.5" y="12" width="4" height="4" rx="1.2" />
      <path d="M8.5 14h9" />
    </>
  ),
  'compact-grid': (
    <>
      <rect x="2.5" y="2.5" width="4" height="4" rx="1.2" />
      <rect x="8" y="2.5" width="4" height="4" rx="1.2" />
      <rect x="13.5" y="2.5" width="4" height="4" rx="1.2" />
      <rect x="2.5" y="8" width="4" height="4" rx="1.2" />
      <rect x="8" y="8" width="4" height="4" rx="1.2" />
      <rect x="13.5" y="8" width="4" height="4" rx="1.2" />
      <rect x="2.5" y="13.5" width="4" height="4" rx="1.2" />
      <rect x="8" y="13.5" width="4" height="4" rx="1.2" />
      <rect x="13.5" y="13.5" width="4" height="4" rx="1.2" />
    </>
  ),
  grid: (
    <>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.6" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
}

export function ViewModeIcon({
  mode,
  size = 16,
}: {
  mode: ViewMode
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      {PATHS[mode]}
    </svg>
  )
}
