import { Link } from '@tanstack/react-router'
import { EntryArt } from '@/components/media/entry-art'
import { EntryCard } from '@/components/media/entry-card'
import { EntryMenu } from '@/components/media/entry-menu'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import type { Entry } from '@/domain/media'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'

/**
 * A grade padrão de `/library` — e a carta é a MESMA da Home, sem uma
 * alteração (`design/mockups/library.html`).
 *
 * A trilha é `minmax(--spacing-card-poster, 1fr)`: cada carta preenche a
 * coluna até `--spacing-card-poster-max` (150px, proporção de capa), e o que
 * sobrar vira espaço simétrico entre elas. Fixar a largura junto com a altura
 * "por simetria" foi o erro da primeira versão da carta, e cobrava uma faixa
 * morta de quase uma carta em tela larga.
 *
 * Aqui não há passo de 72px a respeitar: ele é propriedade da GRADE DA HOME,
 * onde `altura + gap` precisa fechar uma linha de widget (design system, seção
 * 4, alcance corrigido em 29/08/2026). Fora de um widget não há o que encaixar.
 */
export function LibraryGrid({ entries }: { entries: Entry[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="h-card-poster-h w-full max-w-card-poster-max"
        >
          <EntryCard entry={entry} />
        </li>
      ))}
    </ul>
  )
}

/**
 * Modo 3 — grade compacta: só arte; o nome aparece no hover.
 *
 * No Spotify a compactação vem de tirar o rótulo DE BAIXO da arte. Aqui o
 * rótulo já está EM CIMA dela, então tirar texto não encolhe nada — a carta
 * precisou encolher junto, e daí vieram os tokens `--spacing-card-poster-sm*`
 * (150×100–112,5px, 3/4 da carta padrão).
 *
 * Sem +/− aqui, e não é esquecimento: a carta compacta tem 100px de largura, e
 * dois alvos mais o contador não cabem sem virar alvo de 20px. O modo troca
 * ação por densidade — quem quer marcar episódio usa outro dos quatro.
 *
 * **Mas ele estava sem AÇÃO NENHUMA, e isso era esquecimento** (07/09/2026,
 * apontado pelo dono). A decisão de 30/08 era sobre o contador; o `⋯` nunca foi
 * discutido — ele simplesmente não estava aqui, e sem ele não havia como abrir
 * a obra, pô-la numa pilha ou apagá-la sem trocar de modo.
 *
 * **E desde 07/09/2026 ela é LINK INTEIRO**, como a carta cheia e como a de
 * busca — as três formas de carta do app concordam. Esta linha dizia o
 * contrário até então.
 *
 * **Por que só ESTA grade compacta ficou sem:** a de `/piles/:id`
 * (`pile-entry-grid.tsx`) renderiza a carta CHEIA numa caixa menor, então ela
 * herdou os atalhos de graça. Esta é peça própria — e peça própria é onde uma
 * capacidade some sem ninguém decidir que ela sumiria.
 *
 * O `title` no invólucro é o que dá o nome a quem chega pelo toque, onde não
 * existe hover: a faixa que aparece no `group-hover` nunca aparece ali.
 */
export function LibraryCompactGrid({ entries }: { entries: Entry[] }) {
  const typeName = useMediaTypeName()

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster-sm),1fr))] justify-items-center gap-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="h-card-poster-sm-h w-full max-w-card-poster-sm-max"
        >
          <div
            className="group relative h-full w-full overflow-hidden rounded-md"
            title={entry.title}
          >
            <EntryArt entry={entry} className="absolute inset-0 text-2xl" />

            {/**
             * **A carta compacta também é link inteiro — 07/09/2026, decisão
             * do dono.** Consertar só uma das duas cartas poria dois
             * comportamentos na mesma tela, com um seletor de modo entre eles
             * — a mesma armadilha do item 6a, modos do mesmo objeto oferecendo
             * coisas diferentes sem ninguém ter decidido isso.
             *
             * Aqui era mais fácil do que na carta cheia: esta nunca teve a
             * camada `inset-0` de atalhos. O `⋯` é um botão posicionado
             * sozinho em `z-20`, e o selo e a faixa são `z-10` — o link em `z`
             * automático fica embaixo dos três.
             */}
            <Link
              to="/library/$entryId"
              params={{ entryId: String(entry.id) }}
              aria-label={entry.title}
              className="absolute inset-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ink/70 focus-visible:ring-inset"
            />

            <EntryMenu entry={entry} variant="corner" />

            <span
              className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center rounded-sm bg-glass p-1 text-ink backdrop-blur-md"
              title={typeName(entry.mediaType)}
            >
              <MediaTypeIcon type={entry.mediaType} size={11} labelled />
            </span>

            {/* `pointer-events-none`: a faixa é `z-10`, acima do link, e é só
             * texto — sem isto o clique sobre o nome morreria nela. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-surface to-transparent px-2 pt-6 pb-1.5 opacity-0 transition-opacity duration-[var(--motion-chrome)] ease-chrome group-hover:opacity-100">
              <p className="truncate font-medium text-[11px] text-ink">
                {entry.title}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * O carregando desenha a própria grade, não um retângulo genérico: é o que faz
 * a tela não pular de forma quando o dado chega. A opacidade decrescente diz
 * "tem mais coisa vindo" sem prometer um número — não se sabe quantas obras
 * são até a resposta voltar.
 */
const GHOSTS = [1, 1, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15]

export function LibraryGridSkeleton() {
  return (
    <ul
      className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4"
      aria-hidden="true"
    >
      {GHOSTS.map((opacity, index) => (
        <li
          key={`${opacity}-${
            // biome-ignore lint/suspicious/noArrayIndexKey: lista fixa e estática, sem reordenação possível
            index
          }`}
          className="h-card-poster-h w-full max-w-card-poster-max animate-pulse rounded-md bg-raised"
          style={{ opacity: opacity }}
        />
      ))}
    </ul>
  )
}
