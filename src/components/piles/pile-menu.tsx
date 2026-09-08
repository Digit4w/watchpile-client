import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ViewModeIcon } from '@/components/view/view-mode-icon'
import type { PileSort, PileViewMode } from '@/domain/pile-view'
import { PILE_SORTS, PILE_VIEW_MODES } from '@/domain/pile-view'
import { pilesCopy } from '@/routes/-piles.copy'

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

function SortRow({
  label,
  on,
  onSelect,
}: {
  label: string
  on: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      // `aria-checked` e não só o visto: num menu de escolha única o leitor de
      // tela precisa ouvir qual está marcada sem depender do ícone.
      role="menuitemradio"
      aria-checked={on}
      className={`flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm ${
        on
          ? 'text-ink'
          : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
      }`}
    >
      {label}
      {on && <Check />}
    </button>
  )
}

/**
 * Ordenação e exibição no mesmo popover, irmão de `library/library-menu.tsx`.
 *
 * **Sem seção de status**, que a outra tela tem: obra tem status, pilha não.
 * Inventar um eixo pra as duas ficarem simétricas seria simetria contra o
 * modelo (`design/mockups/piles.html`).
 *
 * E **sem grade compacta** na fileira de modos, pelo mesmo motivo pelo qual ela
 * não existe no domínio: ela mostra arte e esconde o nome, e uma pilha sem nome
 * é um quadrado anônimo.
 */
export function PileMenu({
  sort,
  view,
  onSort,
  onView,
  children,
}: {
  sort: PileSort
  view: PileViewMode
  onSort: (next: PileSort) => void
  onView: (next: PileViewMode) => void
  children: React.ReactNode
}) {
  // Controlado só pra fechar na escolha: a ordem é escolha única e o resultado
  // aparece atrás do próprio popover — deixá-lo aberto tampando a grade que
  // acabou de mudar é esconder a resposta da pergunta.
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-2">
        <p className="px-2 pt-1 pb-1 text-faint text-xs">
          {pilesCopy.sectionSort}
        </p>
        {PILE_SORTS.map((value) => (
          <SortRow
            key={value}
            label={pilesCopy.sorts[value]}
            on={sort === value}
            onSelect={() => {
              onSort(value)
              setOpen(false)
            }}
          />
        ))}

        <div className="my-1 border-line border-t" />

        <p className="px-2 pt-1 pb-1 text-faint text-xs">
          {pilesCopy.sectionView}
        </p>
        {/* Fileira de ícones e não linhas com rótulo: os três são a MESMA
         * pergunta respondida em três formas, e o desenho de cada um já é o
         * resultado. */}
        <div className="flex items-center gap-1 px-1 pb-1">
          {PILE_VIEW_MODES.map((value) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={view === value}
              title={pilesCopy.views[value]}
              aria-label={pilesCopy.views[value]}
              onClick={() => {
                onView(value)
                setOpen(false)
              }}
              className={`flex size-9 items-center justify-center rounded-sm ${
                view === value
                  ? 'bg-ink text-surface'
                  : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
              }`}
            >
              <ViewModeIcon mode={value} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
