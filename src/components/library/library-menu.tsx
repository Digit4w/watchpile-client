import { useState } from 'react'
import { ActionMenuSeparator } from '@/components/menu/action-menu'
import {
  FilterAxisRow,
  FilterRow,
  FilterSectionLabel,
  FilterSubview,
  FilterViewRow,
} from '@/components/menu/filter-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { EntrySort, ViewMode } from '@/domain/library-view'
import { ENTRY_SORTS, STATUS_ORDER, VIEW_MODES } from '@/domain/library-view'
import type { EntryStatus, MediaType } from '@/domain/media'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { appCopy } from '@/lib/copy'
import { libraryCopy } from '@/routes/-library.copy'

type Axis = 'status' | 'type'

/**
 * Os quatro eixos de `/library` num popover — e desde 08/09/2026 eles se
 * dividem em DOIS formatos, por decisão do dono (item 15 do ciclo de
 * lançamento).
 *
 * ── O que fica em sub-vista, e o que fica na raiz ───────────────────────────
 * `Status` e `Media type` abrem no lugar. `Sort by` é lista inline e `View as`
 * é a fileira de ícones — a forma que o gatilho deste menu sempre anunciou ao
 * mostrar a ordenação em texto com o ícone do modo ao lado.
 *
 * ── E os dois formatos não são inconsistência: são as duas curvas ───────────
 * **Recorte cresce; arrumação não.** Status é enum fixo (brief, 3.16), mas ele
 * anda junto de `Media type`, que **não tem teto** (3.10) — o usuário cria os
 * dele, e um dia são vinte. `Sort by` e `View as` são fechados por construção.
 * O porquê inteiro, e as peças, moram em `components/menu/filter-menu.tsx`.
 *
 * ── O que a raiz ganha ──────────────────────────────────────────────────────
 * As linhas de eixo mostram o **valor atual à direita**, então o recorte se lê
 * num olhar; e o que se troca mais fica a um clique. A altura fecha nos 256px
 * sem dobra, que era o problema medido que derrubou a lista plana de 22 linhas.
 *
 * ── O que NÃO mudou ─────────────────────────────────────────────────────────
 * A sub-vista de tipo lista **todos**, sempre (01/09): conteúdo de menu que
 * depende da largura da janela muda de assunto sem ninguém pedir. E a ORDEM dos
 * eixos segue a de antes — recorte, arrumação, forma.
 */
export function LibraryMenu({
  status,
  type,
  sort,
  view,
  onStatus,
  onType,
  onSort,
  onView,
  children,
}: {
  status: EntryStatus | null
  type: MediaType | null
  sort: EntrySort
  view: ViewMode
  onStatus: (next: EntryStatus | null) => void
  onType: (next: MediaType | null) => void
  onSort: (next: EntrySort) => void
  onView: (next: ViewMode) => void
  children: React.ReactNode
}) {
  const types = useOfferedMediaTypes(type)
  // Controlado só pra fechar na escolha. Os quatro eixos são escolha ÚNICA, e o
  // resultado aparece atrás do próprio popover — deixá-lo aberto tampando a
  // grade que acabou de mudar é esconder a resposta da pergunta.
  const [open, setOpen] = useState(false)
  const [axis, setAxis] = useState<Axis | null>(null)

  /**
   * Escolher fecha o painel E volta à raiz. A volta acontece com o painel já
   * fechado, então ninguém a vê — ela existe pra que reabrir mostre o recorte
   * inteiro, que é a coisa que a vista raiz serve.
   */
  const choose = (apply: () => void) => () => {
    apply()
    setOpen(false)
    setAxis(null)
  }

  const currentType = types.find((info) => info.slug === type)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAxis(null)
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-2">
        {axis === 'status' && (
          <FilterSubview
            title={libraryCopy.filters.sectionStatus}
            onBack={() => setAxis(null)}
          >
            <FilterRow
              label={libraryCopy.filters.anyStatus}
              on={status === null}
              onSelect={choose(() => onStatus(null))}
            />
            {STATUS_ORDER.map((value) => (
              <FilterRow
                key={value}
                label={appCopy.statuses[value]}
                on={status === value}
                onSelect={choose(() => onStatus(value))}
              />
            ))}
          </FilterSubview>
        )}

        {axis === 'type' && (
          <FilterSubview
            title={libraryCopy.filters.sectionType}
            onBack={() => setAxis(null)}
          >
            <FilterRow
              label={libraryCopy.filters.anyType}
              on={type === null}
              onSelect={choose(() => onType(null))}
            />
            {types.map((info) => (
              <FilterRow
                key={info.slug}
                // O PLURAL, como na fileira: a linha nomeia um conjunto de
                // obras, não uma obra (design system, seção 8, sexta leva).
                label={info.plural}
                on={type === info.slug}
                onSelect={choose(() => onType(info.slug))}
              />
            ))}
          </FilterSubview>
        )}

        {axis === null && (
          <>
            <FilterAxisRow
              label={libraryCopy.filters.sectionStatus}
              value={
                status === null
                  ? libraryCopy.filters.anyStatus
                  : appCopy.statuses[status]
              }
              onOpen={() => setAxis('status')}
            />
            <FilterAxisRow
              label={libraryCopy.filters.sectionType}
              /**
               * O tipo escolhido pode não estar entre os OFERECIDOS enquanto a
               * preferência não chegou — `useOfferedMediaTypes` devolve vazio
               * nesse intervalo (régua de 04/09). Cair no rótulo de "qualquer
               * tipo" ali diria que não há filtro quando há; o slug cru é feio
               * e é verdade, e dura um quadro.
               */
              value={
                type === null
                  ? libraryCopy.filters.anyType
                  : (currentType?.plural ?? type)
              }
              onOpen={() => setAxis('type')}
            />

            <ActionMenuSeparator />

            <FilterSectionLabel>
              {libraryCopy.filters.sectionSort}
            </FilterSectionLabel>
            {ENTRY_SORTS.map((value) => (
              <FilterRow
                key={value}
                label={libraryCopy.sorts[value]}
                on={sort === value}
                onSelect={choose(() => onSort(value))}
              />
            ))}

            <ActionMenuSeparator />

            <FilterSectionLabel>
              {libraryCopy.filters.sectionView}
            </FilterSectionLabel>
            <FilterViewRow
              modes={VIEW_MODES}
              value={view}
              label={(mode) => libraryCopy.views[mode]}
              onSelect={(mode) => choose(() => onView(mode))()}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
