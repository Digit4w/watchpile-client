import { useState } from 'react'
import { ActionMenuSeparator } from '@/components/menu/action-menu'
import {
  FilterRow,
  FilterSectionLabel,
  FilterViewRow,
} from '@/components/menu/filter-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { PileSort, PileViewMode } from '@/domain/pile-view'
import { PILE_SORTS, PILE_VIEW_MODES } from '@/domain/pile-view'
import { pilesCopy } from '@/routes/-piles.copy'

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
 *
 * **Sem sub-vista, e isso não é uma exceção — é a regra dizendo "não" aqui.**
 * Ela é para eixo que CRESCE, e esta tela não tem nenhum: quatro ordenações e
 * três modos são decisão nossa, não dado do usuário. Este menu já era a forma
 * que `/library` voltou a ter em 08/09/2026; o que mudou aqui foi só passar a
 * consumir as peças em vez de mantê-las copiadas.
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
  const choose = (apply: () => void) => () => {
    apply()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-2">
        <FilterSectionLabel>{pilesCopy.sectionSort}</FilterSectionLabel>
        {PILE_SORTS.map((value) => (
          <FilterRow
            key={value}
            label={pilesCopy.sorts[value]}
            on={sort === value}
            onSelect={choose(() => onSort(value))}
          />
        ))}

        <ActionMenuSeparator />

        <FilterSectionLabel>{pilesCopy.sectionView}</FilterSectionLabel>
        {/* Fileira de ícones e não linhas com rótulo: os três são a MESMA
         * pergunta respondida em três formas, e o desenho de cada um já é o
         * resultado. */}
        <FilterViewRow
          modes={PILE_VIEW_MODES}
          value={view}
          label={(mode) => pilesCopy.views[mode]}
          onSelect={(mode) => choose(() => onView(mode))()}
        />
      </PopoverContent>
    </Popover>
  )
}
