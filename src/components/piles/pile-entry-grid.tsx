import { EntryCard } from '@/components/media/entry-card'
import type { Entry } from '@/domain/media'

/**
 * A grade de obras da pilha — **a mesma carta de `/library` e da Home, sem uma
 * alteração** (design system, seção 4). O único parâmetro a mais é `pileId`, e
 * ele não muda o desenho: só acrescenta `Remove from pile` ao menu do `⋯`.
 *
 * **Não reordena**, e isso é decisão (seção 5, 31/08/2026): a carta tem os
 * quatro cantos ocupados e não sobra lugar pra alça, e `touch-none` numa tela
 * cheia de cartas engoliria a rolagem do dedo. Quem quer reordenar troca pro
 * modo de lista — "um modo pode trocar ação por densidade".
 *
 * A trilha é `minmax(--spacing-card-poster, 1fr)`: a carta preenche a coluna
 * até o teto de 150px, e o que sobra vira espaço simétrico entre elas, nunca
 * uma faixa morta de um lado só.
 */
export function PileEntryGrid({
  entries,
  pileId,
}: {
  entries: Entry[]
  pileId: number
}) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="h-card-poster-h w-full max-w-card-poster-max"
        >
          <EntryCard entry={entry} pileId={pileId} />
        </li>
      ))}
    </ul>
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
}: {
  entries: Entry[]
  pileId: number
}) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster-sm),1fr))] justify-items-center gap-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="h-card-poster-sm-h w-full max-w-card-poster-sm-max"
        >
          <EntryCard entry={entry} pileId={pileId} />
        </li>
      ))}
    </ul>
  )
}
