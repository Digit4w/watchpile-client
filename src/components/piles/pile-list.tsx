import { Link } from '@tanstack/react-router'
import type { Pile } from '@/domain/media'
import { countOf, formatRelativeTime } from '@/lib/format'
import { pilesCopy } from '@/routes/-piles.copy'
import { PileActions } from './pile-actions'
import { PileArt } from './pile-art'

const ACTION_TRIGGER =
  'flex size-8 shrink-0 items-center justify-center rounded-sm text-faint opacity-0 outline-none transition-opacity duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:opacity-100 group-hover:opacity-100'

/**
 * O cabeçalho de colunas. São RÓTULOS, não botões: clicar pra ordenar seria um
 * segundo caminho pro que o menu já faz — mesma decisão de `/library`.
 *
 * As colunas somem por breakpoint na ordem inversa da importância: `Updated`
 * primeiro (é a que menos se lê), depois `Description`. Nome e contagem ficam
 * até o fim, porque sem eles não há linha.
 */
function Columns({ withArt }: { withArt: boolean }) {
  return (
    <div className="flex h-8 items-center gap-3 border-line border-b px-2 text-[11px] text-faint uppercase tracking-wide">
      {withArt && <span className="w-10 shrink-0" />}
      <span className="min-w-0 flex-1">{pilesCopy.columns.name}</span>
      <span className="hidden min-w-0 flex-1 sm:block">
        {pilesCopy.columns.description}
      </span>
      <span className="w-20 shrink-0">{pilesCopy.columns.titles}</span>
      <span className="hidden w-28 shrink-0 lg:block">
        {pilesCopy.columns.updated}
      </span>
      <span className="w-8 shrink-0" />
    </div>
  )
}

function Row({
  pile,
  onEdit,
  height,
  art,
}: {
  pile: Pile
  onEdit: () => void
  height: string
  art: boolean
}) {
  return (
    <li>
      <div
        className={`group flex ${height} items-center gap-3 rounded-md px-2 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-card`}
      >
        {art && <PileArt pile={pile} variant="row" className="w-10 shrink-0" />}

        {/* O name leva à pile desde 31/08/2026, quando `/piles/:id` nasceu.
         * Só o NOME, e não a linha inteira: a linha termina no `⋯`, e um
         * link em volta dele aninharia botão em link. */}
        <Link
          to="/piles/$pileId"
          params={{ pileId: String(pile.id) }}
          className="min-w-0 flex-1 truncate rounded-sm font-medium text-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          {pile.name}
        </Link>

        {/* A célula existe mesmo vazia: ela é uma coluna, e some junto com as
         * outras se a linha deixar de desenhá-la quando não há texto. */}
        <p className="hidden min-w-0 flex-1 truncate text-faint text-xs sm:block">
          {pile.description ?? ''}
        </p>

        <span className="w-20 shrink-0 text-faint text-xs tabular-nums">
          {countOf(pile.entryCount, pilesCopy.titleCount)}
        </span>

        <span className="hidden w-28 shrink-0 text-faint text-xs lg:block">
          {formatRelativeTime(pile.updatedAt)}
        </span>

        <PileActions
          pile={pile}
          onEdit={onEdit}
          triggerClassName={ACTION_TRIGGER}
        />
      </div>
    </li>
  )
}

type ListProps = {
  piles: Pile[]
  onEdit: (pile: Pile) => void
}

/**
 * A lista com miniatura. Linha de 56px — contígua, sem gap.
 *
 * O passo de 72px **não vale aqui**: ele é propriedade da grade da Home, onde
 * `altura + gap` precisa fechar numa linha de widget (design system, seção 4,
 * alcance corrigido em 29/08/2026). Fora de um widget não há o que encaixar.
 */
export function PileList({ piles, onEdit }: ListProps) {
  return (
    <div>
      <Columns withArt />
      <ul className="mt-1 flex flex-col">
        {piles.map((pile) => (
          <Row
            key={pile.id}
            pile={pile}
            onEdit={() => onEdit(pile)}
            height="h-14"
            art
          />
        ))}
      </ul>
    </div>
  )
}

/**
 * A lista compacta: a mesma linha sem a miniatura, e mais baixa.
 *
 * `h-11` no celular e `h-9` no desktop porque o piso muda com o dedo — 44px é
 * o alvo de toque, e espremer a linha até 36 num telefone transforma a lista
 * densa em lista imprecisa.
 */
export function PileCompactList({ piles, onEdit }: ListProps) {
  return (
    <div>
      <Columns withArt={false} />
      <ul className="mt-1 flex flex-col">
        {piles.map((pile) => (
          <Row
            key={pile.id}
            pile={pile}
            onEdit={() => onEdit(pile)}
            height="h-11 md:h-9"
            art={false}
          />
        ))}
      </ul>
    </div>
  )
}
