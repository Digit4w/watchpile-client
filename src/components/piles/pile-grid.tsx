import { Link } from '@tanstack/react-router'
import type { Pile } from '@/domain/media'
import { countOf } from '@/lib/format'
import { pilesCopy } from '@/routes/-piles.copy'
import { PileActions } from './pile-actions'
import { PileArt } from './pile-art'

const ACTION_TRIGGER =
  'flex size-8 items-center justify-center rounded-full bg-glass text-ink outline-none backdrop-blur-md transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised focus-visible:ring-[3px] focus-visible:ring-ink/50'

/**
 * O ladrilho da pilha.
 *
 * **Nome e contagem ficam SOB o quadrado, não sobre ele.** A regra "texto sobre
 * a arte" (design system, seção 4) foi decidida pra carta de OBRA, onde a capa
 * identifica; numa pilha quem identifica é o NOME, e cobri-lo com degradê
 * esconderia a única coisa que diz o que aquilo é. A regra geral que sai daí:
 * texto sobre a arte quando a arte identifica, sob a arte quando o texto
 * identifica.
 *
 * **O ladrilho passou a navegar em 31/08/2026**, quando `/piles/:id` nasceu.
 * Até ali ele era deliberadamente inerte — sem `cursor-pointer`, sem realce de
 * entrada —, porque affordance descreve o que existe e não o que vai existir
 * (design system, seção 5). Construir a tela é o que autoriza mexer nisto, e as
 * duas coisas andam no mesmo ciclo: soltar o cursor antes teria feito cada
 * clique se ler como defeito.
 *
 * O link envolve o QUADRADO e o NOME, e não o ladrilho inteiro: o `⋯` mora
 * dentro do quadrado, e um `<a>` em volta dele aninharia um botão num link —
 * markup inválido, e o clique no menu viraria navegação.
 */
function PileCard({ pile, onEdit }: { pile: Pile; onEdit: () => void }) {
  return (
    <div className="group relative flex flex-col gap-2">
      <div className="relative">
        {/* `absolute inset-0` sobre a arte, e não um `<a>` em volta dela: o
         * `⋯` é irmão do link e fica POR CIMA dele (`z-10`), então clicar no
         * menu não navega. `rounded-md` acompanha o quadrado pra o anel de
         * foco não sair quadrado sobre uma arte arredondada. */}
        <PileArt pile={pile} className="w-full" />
        <Link
          to="/piles/$pileId"
          params={{ pileId: String(pile.id) }}
          aria-label={pile.name}
          className="absolute inset-0 rounded-md outline-none transition-[box-shadow] duration-[var(--motion-micro)] ease-chrome focus-visible:ring-[3px] focus-visible:ring-ink/50 group-hover:ring-1 group-hover:ring-line"
        />
        {/* Aparece no hover e no foco de teclado: sem `focus-within` o menu
         * seria inalcançável por Tab, que é como ele some pra quem não usa
         * mouse. */}
        <div className="absolute top-1.5 right-1.5 z-10 opacity-0 transition-opacity duration-[var(--motion-chrome)] ease-chrome focus-within:opacity-100 group-hover:opacity-100">
          <PileActions
            pile={pile}
            onEdit={onEdit}
            triggerClassName={ACTION_TRIGGER}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        {/* O name também leva, porque é ele que identifica a pile — e quem
         * navega por teclado alcança um alvo com texto em vez de um retângulo
         * vazio. `aria-hidden` no link da arte evitaria isto; preferimos dois
         * alvos a um alvo sem nome. */}
        <Link
          to="/piles/$pileId"
          params={{ pileId: String(pile.id) }}
          className="truncate rounded-sm font-medium text-ink text-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          {pile.name}
        </Link>
        <p className="truncate text-faint text-xs tabular-nums">
          {countOf(pile.entryCount, pilesCopy.titleCount)}
        </p>
      </div>
    </div>
  )
}

/**
 * A grade, com a MESMA trilha de `/library`: `auto-fill` sobre
 * `--spacing-card-poster`, `1fr` na coluna, e o teto por item em
 * `max-w-card-poster-max`.
 *
 * A largura é a mesma da carta de obra de propósito — as duas telas fazem
 * fileiras que se leem juntas. O que muda é a PROPORÇÃO da arte (quadrada
 * aqui, pôster lá), e ela é decidida dentro de `PileArt`.
 */
export function PileGrid({
  piles,
  onEdit,
}: {
  piles: Pile[]
  onEdit: (pile: Pile) => void
}) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-5">
      {piles.map((pile) => (
        <li key={pile.id} className="w-full max-w-card-poster-max">
          <PileCard pile={pile} onEdit={() => onEdit(pile)} />
        </li>
      ))}
    </ul>
  )
}

export function PileGridSkeleton() {
  return (
    <ul
      className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-5"
      aria-hidden="true"
    >
      {/* Doze é o que enche uma tela larga sem sobrar muito numa estreita — o
       * esqueleto sugere volume, não a contagem real, que ninguém sabe ainda. */}
      {Array.from({ length: 12 }, (_, index) => index).map((index) => (
        <li key={index} className="w-full max-w-card-poster-max">
          <div className="flex flex-col gap-2">
            <div className="aspect-square animate-pulse rounded-md bg-raised" />
            <div className="h-4 w-3/4 animate-pulse rounded-sm bg-raised" />
            <div className="h-3 w-1/3 animate-pulse rounded-sm bg-raised" />
          </div>
        </li>
      ))}
    </ul>
  )
}
