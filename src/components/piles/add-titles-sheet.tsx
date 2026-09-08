import { useState } from 'react'
import { EntryArt } from '@/components/media/entry-art'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Entry } from '@/domain/media'
import { useAddPileEntry } from '@/hooks/mutations/piles/use-add-pile-entry'
import { useEntries } from '@/hooks/queries/entries/use-entries'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'
import { usePileEntries } from '@/hooks/queries/piles/use-pile-entries'
import { useDebounced } from '@/hooks/use-debounced'
import { pileDetailCopy } from '@/routes/-pile-detail.copy'

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
      <line
        x1="12.4"
        y1="12.4"
        x2="16.5"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

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

function Plus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  )
}

function Row({
  entry,
  inside,
  onAdd,
  taken,
}: {
  entry: Entry
  inside: boolean
  onAdd: () => void
  taken: boolean
}) {
  const typeName = useMediaTypeName()
  return (
    <li className="flex h-14 items-center gap-3 rounded-md px-2 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised">
      <EntryArt
        entry={entry}
        className="aspect-poster w-9 shrink-0 rounded-sm text-xs"
      />
      <span className="min-w-0 flex-1 truncate text-sm">{entry.title}</span>
      <span className="shrink-0 text-faint" title={typeName(entry.mediaType)}>
        <MediaTypeIcon type={entry.mediaType} size={16} strokeWidth={1.6} />
      </span>
      {inside ? (
        // Estado, não botão: já está dentro, e um botão desabilitado convida a
        // um clique que não vai acontecer.
        <span className="flex h-8 shrink-0 items-center gap-1 rounded-sm px-2 text-faint text-xs">
          <Check />
          {pileDetailCopy.add.added}
        </span>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          disabled={taken}
          aria-label={`${pileDetailCopy.add.add}: ${entry.title}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-line text-muted outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50 disabled:opacity-[var(--opacity-disabled)]"
        >
          <Plus />
        </button>
      )}
    </li>
  )
}

/**
 * A folha de pôr obra na pilha.
 *
 * **Ela precisa existir de verdade porque a tela vazia promete o botão.** Sem
 * ela, a saída de uma pilha nova seria "vá pra /library e use o `⋯` de cada
 * obra" — a ação primária mandaria a pessoa embora da tela que ela veio
 * encher (design system, seção 5: affordance descreve o que existe).
 *
 * **A lista não se reordena sob a mão** (design system, seção 8): o `+` de uma
 * obra a marca como dentro no lugar, e nada muda de posição. Foi exatamente
 * este o defeito que `/library` produziu em 30/08/2026, com o item saindo de
 * baixo do cursor no toque seguinte.
 */
export function AddTitlesSheet({
  pileId,
  open,
  onOpenChange,
}: {
  pileId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [searchQuery, setSearch] = useState('')
  const term = useDebounced(searchQuery)
  const add = useAddPileEntry(pileId)

  // A biblioteca inteira, recortada pela busca. `enabled` pela abertura: a
  // folha fechada não deve manter uma consulta viva nem refazê-la ao focar a
  // janela.
  const entries = useEntries(term ? { q: term } : {}, { enabled: open })
  const inside = usePileEntries(pileId)

  const alreadyIn = new Set((inside.data ?? []).map(({ id }) => id))
  const list = entries.data ?? []

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-4" aria-describedby={undefined}>
        <SheetHeader className="pb-0">
          <SheetTitle>{pileDetailCopy.add.title}</SheetTitle>
          <SheetDescription>{pileDetailCopy.add.hint}</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="relative px-4">
            <SearchIcon />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={pileDetailCopy.add.search}
              className="h-9 pr-3 pl-8 text-sm"
            />
          </div>

          <div className="scrollbar-styled min-h-0 flex-1 overflow-y-auto px-3">
            {entries.isSuccess && list.length === 0 ? (
              <p className="px-1 py-6 text-center text-faint text-sm">
                {pileDetailCopy.add.empty}
              </p>
            ) : (
              <ul className="flex flex-col">
                {list.map((entry) => (
                  <Row
                    key={entry.id}
                    entry={entry}
                    inside={alreadyIn.has(entry.id)}
                    taken={add.isPending}
                    onAdd={() => add.mutate(entry.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        <SheetFooter className="border-line border-t">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {pileDetailCopy.add.done}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
