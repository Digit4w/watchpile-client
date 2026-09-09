import type { ReactNode } from 'react'
import { ActionMenuBack } from '@/components/menu/action-menu'
import { ViewModeIcon } from '@/components/view/view-mode-icon'
import type { ViewMode } from '@/domain/library-view'

/**
 * O menu de RECORTE do app — as peças de dentro dele, num lugar só.
 *
 * ── Por que ele existe, e é a mesma história do `⋯` ─────────────────────────
 * Havia **três** menus de filtro escritos à mão — `/library`, `/piles` e
 * `/piles/:id` — e eles já tinham derivado: a linha de escolha aparecia como
 * `Row`, `Row` e `SortRow`, com `justify-between` em duas e `gap-2` na outra; o
 * `Check` estava copiado três vezes, idêntico; e a divisória era
 * `my-1 border-line border-t` nos três, que é **exatamente a variante que
 * `action-menu.tsx` derrubou** ao unificar os cinco menus de `⋯`. Nenhuma
 * dessas diferenças foi decidida.
 *
 * A régua é a de lá, aplicada à segunda família de menus: *peça que aparece em
 * três telas para de ser markup e vira componente*.
 *
 * ── O padrão, e de onde cada parte vem ──────────────────────────────────────
 * - **Eixo que CRESCE abre sub-vista; eixo FECHADO fica inline.** Tipo de mídia
 *   não tem teto (brief, 3.10) e um dia são vinte; ordenação e modo são quatro
 *   e quatro, decisão nossa e não dado. Cobrar um clique por uma elasticidade
 *   que nunca vai ser usada é desenhar contra a curva errada
 * - **A linha de eixo mostra o VALOR ATUAL à direita**, que é o que faz o
 *   recorte inteiro se ler num olhar em vez de procurar vistos numa lista
 * - **`View as` é fileira de ícones**, e os três modos são a mesma pergunta
 *   respondida em três formas — o desenho de cada um já é a resposta
 * - **A divisória é a do `action-menu`** (`h-px bg-line/60`), e não o `border-t`
 *   que os três traziam: a decisão já existia, faltava chegar aqui
 */

/** O nome de um eixo, acima das escolhas dele. */
export function FilterSectionLabel({ children }: { children: string }) {
  return <p className="px-2 pt-1 pb-1 text-faint text-xs">{children}</p>
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M4.5 10.5 8 14 15.5 6" />
    </svg>
  )
}

/** Uma escolha dentro de um eixo. Escolha única, daí o visto e o `radio`. */
export function FilterRow({
  label,
  on,
  onSelect,
  hint,
}: {
  label: string
  on: boolean
  onSelect: () => void
  /** Só onde a escolha tem uma consequência que ela não diz sozinha. */
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={hint}
      // `aria-checked` e não só o visto: num menu de escolha única o leitor de
      // tela precisa ouvir qual está marcada sem depender do ícone.
      role="menuitemradio"
      aria-checked={on}
      className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm ${
        on
          ? 'text-ink'
          : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      {on && (
        <span className="ml-auto">
          <Check />
        </span>
      )}
    </button>
  )
}

/**
 * A linha de um eixo que abre no lugar: o EIXO à esquerda, o valor à direita.
 *
 * A seta é a mesma do `ActionMenuItem submenu` — o app já diz "isto abre outra
 * vista" desse jeito, e um segundo desenho para a mesma promessa seria a
 * divergência que `action-menu.tsx` nasceu para tirar.
 */
export function FilterAxisRow({
  label,
  value,
  onOpen,
}: {
  label: string
  value: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
    >
      <span className="shrink-0 text-ink">{label}</span>
      {/* O valor cede espaço antes do rótulo do eixo: quem identifica a linha é
       * o eixo, e o valor reforça (a régua de 02/09, do nome do provedor). */}
      <span className="ml-auto min-w-0 truncate text-faint text-xs">
        {value}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M8 4l6 6-6 6" />
      </svg>
    </button>
  )
}

/** A cabeça de uma sub-vista: a volta, e o eixo que se está escolhendo. */
export function FilterSubview({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col">
      <ActionMenuBack onClick={onBack} />
      <FilterSectionLabel>{title}</FilterSectionLabel>
      {children}
    </div>
  )
}

/**
 * `View as` — o modo como ÍCONE, nunca como lista de rótulos.
 *
 * **`size-9` e não `flex-1`:** o botão é uma caixa para um glifo, e glifo é
 * quadrado. Esticá-lo para preencher a largura faria o mesmo controle ter
 * botões de tamanhos diferentes em `/piles` (três modos) e em `/library`
 * (quatro) — a peça mudaria de forma por causa de quantos vizinhos ela tem
 * hoje, que é o erro que o CSV da tela de import já ensinou.
 *
 * O ativo usa o preenchimento sólido e não `bg-raised`, que é o mesmo
 * tingimento do hover: dois estados com a mesma cor não se distinguem no
 * instante em que o cursor está justamente sobre a fileira.
 */
export function FilterViewRow<Mode extends ViewMode>({
  modes,
  value,
  label,
  onSelect,
}: {
  modes: readonly Mode[]
  value: Mode
  label: (mode: Mode) => string
  onSelect: (mode: Mode) => void
}) {
  return (
    <div className="flex items-center gap-1 px-1 pb-1">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          role="menuitemradio"
          aria-checked={value === mode}
          aria-label={label(mode)}
          title={label(mode)}
          onClick={() => onSelect(mode)}
          className={`flex size-9 items-center justify-center rounded-sm ${
            value === mode
              ? 'bg-ink text-surface'
              : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
          }`}
        >
          <ViewModeIcon mode={mode} />
        </button>
      ))}
    </div>
  )
}
