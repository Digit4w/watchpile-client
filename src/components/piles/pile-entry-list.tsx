import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { EntryArt } from '@/components/media/entry-art'
import { EntryMenu } from '@/components/media/entry-menu'
import { EntryProgress } from '@/components/media/entry-progress'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { StatusButton } from '@/components/media/status-button'
import type { Entry } from '@/domain/media'
import { useMovePileEntry } from '@/hooks/mutations/piles/use-move-pile-entry'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'
import { pileKeys } from '@/hooks/queries/piles/keys'
import { appCopy } from '@/lib/copy'
import { formatDate } from '@/lib/format'
import { pileDetailCopy } from '@/routes/-pile-detail.copy'

function Grip() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="7.5" cy="5" r="1.1" />
      <circle cx="12.5" cy="5" r="1.1" />
      <circle cx="7.5" cy="10" r="1.1" />
      <circle cx="12.5" cy="10" r="1.1" />
      <circle cx="7.5" cy="15" r="1.1" />
      <circle cx="12.5" cy="15" r="1.1" />
    </svg>
  )
}

function Star() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 1l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1L4.6 17l1.3-6L1.3 7.2l6.1-.6L10 1z" />
    </svg>
  )
}

/**
 * A linha arrastável.
 *
 * **A alça é o PRIMEIRO FILHO da linha, não um irmão dela** — e isso não é
 * arrumação. Como irmã, ela ficava fora do `px-2` e do `gap-3` da linha, e o
 * título saía 12px à esquerda do cabeçalho de colunas: a coluna deixa de ser
 * coluna no instante em que uma peça não participa do mesmo ritmo. Apareceu na
 * tela pronta, não no mockup — as duas peças nunca são medidas juntas ao
 * desenhar.
 *
 * `listeners` vão só na alça, e não na linha inteira: `touch-none` na linha
 * toda engoliria a rolagem do dedo numa pilha de duzentos itens.
 *
 * **Este comentário dizia que o widget da Home fazia diferente, e justificava a
 * divergência por contexto — deixou de ser verdade em 07/09/2026**, quando a
 * linha do widget ganhou alça (decisão do dono). O argumento do contexto caiu
 * pelo motivo que só aparece quando a linha passa a CONTER alvos: com
 * `activationConstraint: { distance: 6 }`, apertar o título e mover seis pixels
 * começa um arrasto em vez de abrir a obra.
 *
 * `cursor-grab`/`grabbing` e nunca `pointer`: mão aberta convida a pegar, e
 * `pointer` prometeria "isto navega ou aciona" (design system, seção 5).
 */
function SortableRow({
  entry,
  pileId,
  compact,
}: {
  entry: Entry
  pileId: number
  compact: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.7 : undefined,
      }}
    >
      <Row
        entry={entry}
        pileId={pileId}
        compact={compact}
        handle={
          <button
            type="button"
            aria-label={pileDetailCopy.reorder}
            title={pileDetailCopy.reorder}
            // Sempre visível no toque, revelada no hover no ponteiro: no toque
            // não há hover, e uma alça escondida ali seria inexistente.
            className="flex w-[18px] shrink-0 cursor-grab touch-none items-center justify-center text-faint opacity-0 outline-none transition-opacity duration-[var(--motion-micro)] ease-chrome focus-visible:opacity-100 active:cursor-grabbing group-hover/row:opacity-100 max-md:opacity-100"
            {...attributes}
            {...listeners}
          >
            <Grip />
          </button>
        }
      />
    </li>
  )
}

/**
 * O cabeçalho de colunas. **Rótulo, nunca botão** — ordenar daqui seria um
 * segundo caminho pro que o menu já faz (design system, seção 5, 30/08/2026).
 *
 * `aria-hidden` porque o leitor de tela lê a linha inteira em ordem: a
 * associação visual coluna ↔ valor não se traduz em áudio, e repetir "Status"
 * antes de cada valor seria pior que não ter.
 *
 * As larguras repetem as da linha — é essa repetição que faz a coluna ser
 * coluna. `reordenavel` reserva a caixa da alça nos DOIS, senão a fileira
 * inteira desliza 30px quando o arrasto liga.
 */
function ColumnHeader({
  compact,
  reorderable,
}: {
  compact: boolean
  reorderable: boolean
}) {
  return (
    <div
      className="flex h-8 items-center gap-3 border-line border-b px-2 text-[11px] text-faint uppercase tracking-wide"
      aria-hidden="true"
    >
      {reorderable && <span className="w-[18px] shrink-0" />}
      <span className="w-[18px] shrink-0" />
      {!compact && <span className="w-9 shrink-0" />}
      <span className="min-w-0 flex-1">{pileDetailCopy.columns.title}</span>
      <span className="hidden w-20 shrink-0 md:block">
        {pileDetailCopy.columns.status}
      </span>
      <span className="hidden w-24 shrink-0 lg:block">
        {pileDetailCopy.columns.added}
      </span>
      <span className="hidden w-12 shrink-0 sm:block">
        {pileDetailCopy.columns.rating}
      </span>
      <span className="w-36 shrink-0 text-center">
        {pileDetailCopy.columns.progress}
      </span>
      <span className="w-8 shrink-0" />
    </div>
  )
}

function Row({
  entry,
  pileId,
  compact,
  handle,
}: {
  entry: Entry
  pileId: number
  compact: boolean
  /**
   * A alça, quando a lista reordena. Vem de fora porque quem sabe arrastar é
   * o `SortableRow`; entra aqui dentro pra participar do mesmo `px-2` e
   * `gap-3` das outras colunas.
   */
  handle?: ReactNode
}) {
  const typeName = useMediaTypeName()
  return (
    <div
      className={`group/row flex items-center gap-3 rounded-md px-2 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-card ${compact ? 'h-11' : 'h-14'}`}
    >
      {handle}
      <span className="shrink-0 text-faint" title={typeName(entry.mediaType)}>
        <MediaTypeIcon
          type={entry.mediaType}
          size={18}
          strokeWidth={1.6}
          labelled
        />
      </span>
      {!compact && (
        <EntryArt
          entry={entry}
          className="aspect-poster w-9 shrink-0 rounded-sm text-xs"
        />
      )}
      <p className="min-w-0 flex-1 truncate text-sm">{entry.title}</p>
      {/* **A coluna inteira é o CONTROLE desde 10/09/2026** (decisão do dono).
       * Ela era rótulo de leitura, e um filme ou jogo em modo lista não tinha
       * como mudar de status sem abrir a obra. Em TODAS as linhas e não só nas
       * sem contador: duas coisas diferentes na mesma coluna é a confusão que o
       * conserto de 07/09 tirou. */}
      <span className="hidden shrink-0 md:block">
        <StatusButton entry={entry} variant="cell" />
      </span>
      <span className="hidden w-24 shrink-0 text-faint text-xs tabular-nums lg:block">
        {formatDate(entry.createdAt)}
      </span>
      <span className="hidden w-12 shrink-0 items-center gap-1 text-muted text-xs tabular-nums sm:flex">
        {entry.rating !== null && (
          <>
            {!compact && <Star />}
            <span className="sr-only">{appCopy.entry.rating}</span>
            {entry.rating.toFixed(1)}
          </>
        )}
      </span>
      <span className="flex w-36 shrink-0 items-center justify-center">
        {/* `statusInRow`: esta linha tem coluna de `Status`, como as de
         * `/library`. O status mora lá, e aqui fica o vão. */}
        <EntryProgress entry={entry} statusInRow />
      </span>
      <EntryMenu entry={entry} pileId={pileId} variant="row" />
    </div>
  )
}

type PileEntryListProps = {
  entries: Entry[]
  pileId: number
  compact: boolean
  /**
   * Só na ordem `manual` e só nos modos de lista (`domain/pile-detail-view.ts`).
   * Falso, a alça some e nada mais muda.
   */
  reorderable: boolean
}

export function PileEntryList({
  entries,
  pileId,
  compact,
  reorderable,
}: PileEntryListProps) {
  const queryClient = useQueryClient()
  const move = useMovePileEntry(pileId)

  /**
   * Distância de ativação: sem ela o `pointerdown` de um clique já conta como
   * arrasto. 6px é curto o bastante pra não parecer travado e longo o bastante
   * pra sobreviver ao tremor do dedo — o mesmo número do widget da Home.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const from = entries.findIndex(({ id }) => id === active.id)
    const to = entries.findIndex(({ id }) => id === over.id)
    if (from === -1 || to === -1) {
      return
    }

    const reordered = arrayMove(entries, from, to)

    // Otimista: esperar a rede pra mover o item desfaria a sensação de que ele
    // ficou onde foi solto. A resposta do servidor devolve a lista inteira e
    // sobrescreve isto; se falhar, o cache volta à verdade dele.
    queryClient.setQueryData(pileKeys.entries(pileId), reordered)

    // `after` é quem fica ATRÁS na ordem nova — `null` quando vai pro topo. O
    // cliente nunca vê nem manda `position`: quem escolhe o número é o
    // servidor (brief, 3.14).
    const previous = to === 0 ? null : (reordered[to - 1]?.id ?? null)
    move.mutate({ entryId: Number(active.id), after: previous })
  }

  const rows = entries.map((entry) =>
    reorderable ? (
      <SortableRow
        key={entry.id}
        entry={entry}
        pileId={pileId}
        compact={compact}
      />
    ) : (
      <li key={entry.id}>
        <Row entry={entry} pileId={pileId} compact={compact} />
      </li>
    ),
  )

  const list = (
    <div>
      <ColumnHeader compact={compact} reorderable={reorderable} />
      <ul className="mt-1 flex flex-col">{rows}</ul>
    </div>
  )

  if (!reorderable) {
    return list
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={entries.map(({ id }) => id)}
        strategy={verticalListSortingStrategy}
      >
        {list}
      </SortableContext>
    </DndContext>
  )
}
