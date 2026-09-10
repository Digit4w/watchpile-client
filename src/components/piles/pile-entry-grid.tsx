import { closestCenter, DndContext } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { EntryCard } from '@/components/media/entry-card'
import type { Entry } from '@/domain/media'
import { useMovePileEntry } from '@/hooks/mutations/piles/use-move-pile-entry'
import { pileKeys } from '@/hooks/queries/piles/keys'
import { useReorderable } from '@/hooks/use-reorderable'

/**
 * A carta arrastável da GRADE de uma pilha — 10/09/2026, e ela **reabre a
 * decisão de 31/08** que tirou o arrasto daqui.
 *
 * Aquela decisão excluiu os modos de grade por dois argumentos, e **os dois
 * eram sobre uma alça PERMANENTE**: os quatro cantos da carta já estão
 * ocupados, e `touch-none` numa tela cheia de cartas engoliria a rolagem do
 * dedo. Com o MODO que a Home estreou horas antes, os dois caem juntos — não há
 * alça a encaixar, porque **ela é a carta**; e `touch-none` só vale enquanto se
 * reordena, que é quando ninguém está rolando.
 *
 * *O argumento de uma decisão pode ser sobre COMPETIÇÃO por espaço, e quando a
 * competição acaba a decisão não vale mais.*
 *
 * **A peça é a mesma da Home de propósito** — mesma classe, mesmo gatilho no
 * menu da obra, mesmo `wp-card-moving`. Duas telas com a mesma regra é como
 * elas divergem, e estas duas já divergiram na mesma linha duas vezes esta
 * semana.
 */
function SortableCard({
  id,
  moving,
  className,
  children,
}: {
  id: number
  moving: boolean
  className: string
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !moving })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.7 : undefined,
      }}
      className={
        moving
          ? `wp-card-moving cursor-grab touch-none active:cursor-grabbing ${className}`
          : className
      }
      {...(moving ? attributes : {})}
      {...(moving ? listeners : {})}
    >
      {children}
    </li>
  )
}

/**
 * O que as duas grades compartilham: o estado do modo, o dnd, e o `reorder` que
 * viaja pro menu de cada carta.
 */
function useGridReorder(entries: Entry[], pileId: number, enabled: boolean) {
  const [on, setOn] = useState(false)
  const move = useMovePileEntry(pileId)
  const { sensors, onDragEnd } = useReorderable({
    items: entries,
    queryKey: pileKeys.entries(pileId),
    move: move.mutate,
  })

  /**
   * Trocar de ordenação ou de modo **desliga**: o modo é sobre a lista que está
   * na tela, e a que estava deixou de estar. Sem isto, voltar pra grade traria
   * o modo de uma visita anterior — a mesma régua da sub-vista de `/search`.
   */
  const moving = enabled && on

  return {
    moving,
    reorder: enabled
      ? { on: moving, toggle: () => setOn((v) => !v) }
      : undefined,
    wrap: (children: React.ReactNode) =>
      enabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={entries.map(({ id }) => id)}
            strategy={rectSortingStrategy}
          >
            {children}
          </SortableContext>
        </DndContext>
      ) : (
        children
      ),
  }
}

/**
 * A grade de obras da pilha — **a mesma carta de `/library` e da Home, sem uma
 * alteração** (design system, seção 4). O único parâmetro a mais é `pileId`, e
 * ele não muda o desenho: só acrescenta `Remove from pile` ao menu do `⋯`.
 *
 * **Ela REORDENA desde 10/09/2026**, e esta prosa dizia o contrário: a decisão
 * de 31/08 excluiu a grade porque a carta não tinha onde pôr alça e porque
 * `touch-none` engoliria a rolagem. Os dois argumentos eram sobre uma alça
 * PERMANENTE, e com o modo do menu os dois caem — ver `SortableCard`, acima.
 *
 * A trilha é `minmax(--spacing-card-poster, 1fr)`: a carta preenche a coluna
 * até o teto de 150px, e o que sobra vira espaço simétrico entre elas, nunca
 * uma faixa morta de um lado só.
 */
export function PileEntryGrid({
  entries,
  pileId,
  reorderable = false,
}: {
  entries: Entry[]
  pileId: number
  /** A ordenação da tela é a manual? Quem decide é `reorderAffordance`. */
  reorderable?: boolean
}) {
  const { moving, reorder, wrap } = useGridReorder(entries, pileId, reorderable)

  return wrap(
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
      {entries.map((entry) => (
        <SortableCard
          key={entry.id}
          id={entry.id}
          moving={moving}
          className="h-card-poster-h w-full max-w-card-poster-max"
        >
          <EntryCard entry={entry} pileId={pileId} reorder={reorder} />
        </SortableCard>
      ))}
    </ul>,
  )
}

/**
 * A grade compacta — 3/4 da carta padrão em cada eixo. Sem `+/−`, porque em
 * 100px de largura dois alvos mais o contador não cabem sem virar alvo de
 * 20px: um modo pode oferecer menos que os irmãos, desde que os irmãos
 * ofereçam (design system, seção 5, 30/08/2026).
 */
export function PileEntryCompactGrid({
  entries,
  pileId,
  reorderable = false,
}: {
  entries: Entry[]
  pileId: number
  reorderable?: boolean
}) {
  const { moving, reorder, wrap } = useGridReorder(entries, pileId, reorderable)

  return wrap(
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster-sm),1fr))] justify-items-center gap-3">
      {entries.map((entry) => (
        <SortableCard
          key={entry.id}
          id={entry.id}
          moving={moving}
          className="h-card-poster-sm-h w-full max-w-card-poster-sm-max"
        >
          <EntryCard entry={entry} pileId={pileId} reorder={reorder} />
        </SortableCard>
      ))}
    </ul>,
  )
}
