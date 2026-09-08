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
  horizontalListSortingStrategy,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { EntryArt } from '@/components/media/entry-art'
import { EntryCard } from '@/components/media/entry-card'
import { EntryMenu } from '@/components/media/entry-menu'
import { EntryProgress } from '@/components/media/entry-progress'
import type { HomeWidget } from '@/domain/home-widget'
import type { Entry } from '@/domain/media'
import { requestFailure } from '@/domain/request-failure'
import { useMoveWidgetEntry } from '@/hooks/mutations/home-widgets/use-move-widget-entry'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import { useWidgetEntries } from '@/hooks/queries/home-widgets/use-widget-entries'
import { appCopy } from '@/lib/copy'
import { homeCopy } from '@/routes/-home.copy'

/**
 * Um item arrastável.
 *
 * É ele quem carrega o `<li>` e o tamanho; o conteúdo (linha ou carta) fica
 * dentro. Assim as regras de `<ul>` continuam válidas e o componente de
 * conteúdo não precisa saber que existe arrasto.
 *
 * `touch-none` porque sem isso o navegador rola a página em vez de deixar o
 * `dnd-kit` receber o gesto — é o motivo número um de "arrastar não funciona no
 * celular".
 *
 * `cursor-grab` / `active:cursor-grabbing` é o mesmo par que o handle do widget
 * já usa (`widget-frame.tsx`): mão aberta convida a pegar, mão fechada confirma
 * que pegou. **Não é `cursor-pointer`** — aquele promete "isto navega ou
 * aciona", e um item que na verdade se arrasta ficaria mentindo sobre o próprio
 * gesto.
 *
 * Os botões de dentro não herdam: o preflight do Tailwind v4 fixa
 * `cursor: default` em `button`, então o `+`, o `−` e os atalhos continuam com
 * o cursor deles.
 */
function Sortable({
  id,
  className,
  children,
}: {
  id: number
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
  } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        // O item em movimento passa por cima dos vizinhos, e some do lugar de
        // origem só o suficiente pra o buraco ser legível.
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.7 : undefined,
      }}
      className={`cursor-grab touch-none active:cursor-grabbing ${className}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </li>
  )
}

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

/**
 * Linha da lista, 56px cravados — uma linha de grade por linha de lista
 * (`domain/home-metrics.ts`). A miniatura é `w-9` porque 36px de largura dão
 * 54px de altura no 2:3, que é o que cabe nos 56 com folga de um fio.
 *
 * Sem divisória: as linhas são separadas pelo `gap-4` do container, que é o
 * mesmo 16px que a conta do encaixe usa. Divisória mais gap seria contar o
 * espaço duas vezes.
 *
 * ── Ela tem as MESMAS ações que toda outra linha de obra — 07/09/2026 ───────
 * Era o único lugar do app onde a obra não abria nem oferecia nada: o título
 * era um `<p>` e não havia `⋯`. O ciclo que levou `EntryMenu variant="row"` às
 * duas listas de `/library` e às de `/piles/:id` não passou por aqui, e a peça
 * já existia — *o que muda entre duas formas da mesma peça é o GATILHO, nunca
 * o inventário* (design system, seção 5).
 *
 * `group/row` porque é dele que o `⋯` e a alça leem o hover.
 */
function ListRow({ entry, handle }: { entry: Entry; handle: ReactNode }) {
  return (
    <div className="group/row flex h-full items-center gap-3">
      {handle}
      <EntryArt
        entry={entry}
        className="aspect-poster w-9 shrink-0 rounded-sm text-xs"
      />
      {/* O título NAVEGA, como na carta e nas outras listas. `<a>` e não um
       * `onClick`: destino escrito como botão perde abrir em outra aba e
       * copiar o endereço (a régua do `ActionMenuLink`). */}
      <Link
        to="/library/$entryId"
        params={{ entryId: String(entry.id) }}
        className="min-w-0 flex-1 truncate text-sm outline-none hover:underline focus-visible:underline"
      >
        {entry.title}
      </Link>
      <EntryProgress entry={entry} />
      <EntryMenu entry={entry} variant="row" />
    </div>
  )
}

/**
 * A linha arrastável do widget de lista.
 *
 * **`listeners` vão só na ALÇA, e não na linha inteira** — 07/09/2026, decisão
 * do dono. `/piles/:id` decidiu em 31/08 que *arrasto mora onde a alça cabe*, e
 * o widget era o que estava fora da regra. O comentário de `pile-entry-list.tsx`
 * justificava a diferença por contexto (widget é caixa pequena, a pilha é a
 * tela inteira); o que derrubou o argumento é que a linha passou a CONTER
 * alvos — com `activationConstraint: { distance: 6 }`, apertar o título e mover
 * seis pixels começava um arrasto em vez de abrir a obra.
 *
 * `touch-none` desce junto para a alça: na linha inteira ele engoliria a
 * rolagem do dedo dentro do widget.
 *
 * A alça é o PRIMEIRO FILHO da linha, e não uma irmã dela — como em
 * `/piles/:id`, e pelo mesmo motivo: como irmã ela ficaria fora do `gap-3`, e
 * o resto da linha andaria.
 */
function SortableListRow({ entry }: { entry: Entry }) {
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
      className="h-14 shrink-0"
    >
      <ListRow
        entry={entry}
        handle={
          <button
            type="button"
            aria-label={homeCopy.widget.reorder}
            title={homeCopy.widget.reorder}
            // Sempre visível no toque, revelada no hover no ponteiro — a mesma
            // régua da alça de `/piles/:id`: sem hover, alça escondida é alça
            // inexistente.
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

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="h-14 animate-pulse rounded-md bg-raised" />
      <div className="h-14 animate-pulse rounded-md bg-raised opacity-70" />
      <div className="h-14 animate-pulse rounded-md bg-raised opacity-40" />
    </div>
  )
}

export function WidgetContent({ widget }: { widget: HomeWidget }) {
  const entries = useWidgetEntries(widget.id)
  const move = useMoveWidgetEntry(widget.id)
  const queryClient = useQueryClient()

  /**
   * Distância de ativação: sem ela o `pointerdown` de um clique já conta como
   * arrasto, e o `+` da carta pararia de funcionar. 6px é curto o bastante pra
   * não parecer travado e longo o bastante pra sobreviver ao tremor do dedo.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || entries.data === undefined) {
      return
    }

    const current = entries.data
    const from = current.findIndex(({ id }) => id === active.id)
    const to = current.findIndex(({ id }) => id === over.id)
    if (from === -1 || to === -1) {
      return
    }

    const reordered = arrayMove(current, from, to)

    // Otimista de propósito: a resposta do servidor devolve a lista inteira,
    // mas esperar a rede pra mover o item desfaria a sensação de que ele ficou
    // onde foi solto. Se a escrita falhar, o `onError` do hook invalida e a
    // verdade do servidor volta.
    queryClient.setQueryData(homeWidgetKeys.entries(widget.id), reordered)

    // `after` é quem fica ATRÁS do item na ordem nova — `null` quando ele vai
    // pro topo. É o mesmo contrato do reorder de pile.
    const previous = to === 0 ? null : (reordered[to - 1]?.id ?? null)
    move.mutate({ entryId: Number(active.id), after: previous })
  }

  if (widget.type === 'stats') {
    return <p className="text-faint text-sm">{homeCopy.widget.notBuilt}</p>
  }

  if (entries.isPending) {
    return <Skeleton />
  }

  if (entries.isError) {
    // O TÍTULO e não o corpo: aqui a caixa é um widget de grade, e a frase
    // longa quebrava em quatro linhas dentro dela. Quem quiser o detalhe tem a
    // tela inteira ao lado; o widget só precisa dizer que aquele pedaço falhou.
    return (
      <p className="text-danger text-sm">
        {appCopy.error[requestFailure(entries.error)].title}
      </p>
    )
  }

  if (entries.data.length === 0) {
    return <p className="text-faint text-sm">{homeCopy.widget.emptyContent}</p>
  }

  const ids = entries.data.map(({ id }) => id)

  /**
   * `restrictToParentElement` prende o item ao próprio widget. Sem ele dá pra
   * arrastar uma carta pra cima de outro widget, o que não significa nada: a
   * ordem é de dentro de um widget só, e cada um lembra a sua
   * (`widget_entry_order`).
   *
   * O arrasto do WIDGET na grade não briga com este: lá o gatilho é o handle
   * (`.widget-drag-handle`), que só existe no modo de edição e não fica dentro
   * do conteúdo.
   */
  const dnd = (
    children: React.ReactNode,
    strategy: typeof rectSortingStrategy,
  ) => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={strategy}>
        {children}
      </SortableContext>
    </DndContext>
  )

  if (widget.type === 'list') {
    return dnd(
      <ul className="flex flex-col gap-4">
        {entries.data.map((entry) => (
          <SortableListRow key={entry.id} entry={entry} />
        ))}
      </ul>,
      verticalListSortingStrategy,
    )
  }

  if (widget.type === 'scroll') {
    /**
     * Uma fileira só que desliza — é a definição do tipo, e é por isso que a
     * altura dele é travada em `home-metrics.ts`.
     *
     * `scrollbar-none` e não `scrollbar-styled`: com `scrollbar-width: thin` a
     * barra horizontal come ~8px de altura no Windows e no Linux (no macOS ela
     * é sobreposta e não come nada), e esses 8px sairiam de dentro dos 200px
     * da fileira — cortando exatamente a base da carta, que é o problema que
     * este ciclo existe pra resolver.
     */
    return dnd(
      <ul className="scrollbar-none flex gap-4 overflow-x-auto">
        {entries.data.map((entry) => (
          // Largura fixa: numa fita horizontal não existe "sobra à direita"
          // pra distribuir — o que não cabe rola.
          <Sortable
            key={entry.id}
            id={entry.id}
            className="h-card-poster-h w-card-poster shrink-0"
          >
            <EntryCard entry={entry} />
          </Sortable>
        ))}
      </ul>,
      horizontalListSortingStrategy,
    )
  }

  /**
   * Trilha `1fr`: preenche a largura toda, sempre — nunca sobra faixa morta à
   * direita, em nenhum tamanho de tela, e nunca transborda.
   *
   * Isto parecia impossível enquanto a carta tinha tamanho fixo nos dois eixos,
   * mas a largura **nunca** entrou na conta do encaixe: quem precisa ser exata
   * é a ALTURA (`domain/home-metrics.ts`). Fixar as duas foi restrição a mais,
   * e o preço dela era a sobra.
   *
   * A carta cresce dentro da trilha até `--spacing-card-poster-max` (150px,
   * a proporção 3:4 de `--aspect-cover`). Passou disso, o excedente vira espaço
   * simétrico dos dois lados, via `justify-items-center` — o que num widget
   * estreito, de duas ou três colunas, evita a carta virar quase um quadrado.
   */
  return dnd(
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-card-poster),1fr))] justify-items-center gap-4">
      {entries.data.map((entry) => (
        <Sortable
          key={entry.id}
          id={entry.id}
          className="h-card-poster-h w-full max-w-card-poster-max"
        >
          <EntryCard entry={entry} />
        </Sortable>
      ))}
    </ul>,
    rectSortingStrategy,
  )
}
