/**
 * Os glifos dos itens de menu, num lugar só.
 *
 * Eles estavam desenhados dentro de cada menu, com `strokeWidth` e tamanho
 * diferentes — e a lixeira tinha dois desenhos distintos em dois arquivos. Um
 * ícone que muda de traço entre dois menus com a MESMA ação vira dois
 * vocabulários para a mesma coisa.
 *
 * Não vêm do acervo de `lucide-react` de propósito: aquele é o acervo do
 * OBJETO — o glifo que identifica um tipo de mídia (design system, seção 5) —,
 * e estes são chrome. Misturar os dois faria a lista curada do contrato
 * responder por decoração de menu.
 */

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Lista com um `+` — pôr numa pilha. */
export function PileAddIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M3 5h9M3 10h9M3 15h5M15 8v8M11 12h8" />
    </svg>
  )
}

/** A mesma lista com um `−` — tirar de uma pilha. O par é o que ensina os dois. */
export function PileRemoveIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M3 5h9M3 10h9M3 15h5M11 12h8" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6" />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M12.5 2.5l5 5-2.5 1-3 3 .5 3-6.5-6.5 3-.5 3-3z" />
      <path d="M6 14l-2.5 2.5" />
    </svg>
  )
}

export function EditIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M13 3l4 4L7 17H3v-4L13 3z" />
    </svg>
  )
}

/**
 * Uma seta saindo de um quadrado — abrir a obra.
 *
 * Não é a lupa nem o "olho": lupa é procurar, e olho é ver/esconder, que é o
 * vocabulário de um toggle. O que este item faz é IR a outro lugar.
 */
export function OpenIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M11 4h5v5M16 4l-7 7M15 12v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" />
    </svg>
  )
}

/**
 * O visto de uma escolha marcada.
 *
 * **Ele estava desenhado três vezes, idêntico** — em `filter-menu.tsx`, em
 * `search-scope.tsx` e no `<select>` que a segunda substituiu. Traço 2 e não
 * 1.6 como o resto do arquivo: é o único glifo que diz um ESTADO em vez de uma
 * ação, e a diferença de peso é o que o separa da lista à esquerda dele.
 */
export function CheckIcon() {
  return (
    <svg
      {...base}
      width="14"
      height="14"
      strokeWidth="2"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M4.5 10.5 8 14 15.5 6" />
    </svg>
  )
}

/**
 * A seta de "isto abre uma lista", que gira quando ela está aberta.
 *
 * A rotação é **a única dica de estado** que o gatilho de um popover tem — o
 * painel some do fluxo, então o botão precisa dizer sozinho que ele é a origem
 * do que está aberto.
 */
export function ChevronIcon({
  size = 14,
  open = false,
}: {
  size?: number
  open?: boolean
}) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      strokeWidth="1.7"
      className={`shrink-0 text-faint transition-transform duration-[var(--motion-micro)] ease-chrome ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    >
      <path d="M6.5 8.5 10 12l3.5-3.5" />
    </svg>
  )
}
