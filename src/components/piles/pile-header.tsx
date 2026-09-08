import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ViewModeIcon } from '@/components/view/view-mode-icon'
import type { PileSort, PileViewMode } from '@/domain/pile-view'
import { countOf } from '@/lib/format'
import { pilesCopy } from '@/routes/-piles.copy'
import { CreatePilePopover } from './create-pile-popover'
import { PileMenu } from './pile-menu'

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

function PlusIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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

type PileHeaderProps = {
  /** Quantas pilhas a lista tem AGORA, já com a busca aplicada. */
  showing: number
  /** Quantas existem no total, sem busca. `null` enquanto carrega. */
  total: number | null
  search: string
  sort: PileSort
  view: PileViewMode
  onSearch: (next: string) => void
  onSort: (next: PileSort) => void
  onView: (next: PileViewMode) => void
}

/**
 * Duas faixas no desktop, uma no celular — mesma anatomia de `LibraryHeader`,
 * e a diferença é a que falta.
 *
 * **Não há fileira de chips.** Em `/library` ela é permanente porque obra tem
 * TIPO, um eixo sempre presente; pilha não tem eixo nenhum, e chip vazio é
 * chrome que não faz nada (`design/mockups/piles.html`). O mockup dava função à
 * fileira quando havia busca — escopo `All / Piles / Titles` —, e isso volta
 * junto com a busca que também acha obras, que é outro ciclo.
 *
 * `border-b` aqui é divisória, não contorno de caixa: a regra de `ring` em vez
 * de `border` (design system, seção 4) vale pra container que segura conteúdo,
 * e esta é a mesma exceção que `LibraryHeader` documenta.
 */
export function PileHeader({
  showing,
  total,
  search,
  sort,
  view,
  onSearch,
  onSort,
  onView,
}: PileHeaderProps) {
  const filtered = search !== ''
  const count =
    total === null
      ? null
      : filtered
        ? `${showing} ${pilesCopy.countFiltered} ${countOf(total, pilesCopy.count)}`
        : countOf(total, pilesCopy.count)

  const searchField = (height: string) => (
    <div className="relative min-w-0 flex-1">
      <SearchIcon />
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={pilesCopy.search}
        className={`${height} pr-3 pl-8 text-sm`}
      />
    </div>
  )

  return (
    // `-mx-4 -mt-4` cancela o padding do `<main>` do shell: o cabeçalho encosta
    // nas bordas da área de conteúdo, e o `px` interno devolve o alinhamento.
    // `top` muda com a plataforma porque o que está acima dele muda: no celular
    // há a barra do `app-shell` presa no topo, no desktop não há nada.
    <header className="sticky top-[var(--wp-app-bar)] z-20 -mx-4 -mt-4 mb-4 border-line border-b bg-glass px-4 backdrop-blur md:top-0 md:-mx-8 md:-mt-8 md:px-8">
      <div className="hidden h-18 items-center justify-between gap-4 md:flex">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate font-semibold text-xl tracking-tight">
            {pilesCopy.title}
          </h1>
          {count && (
            <span className="shrink-0 text-faint text-sm tabular-nums">
              {count}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative flex w-56">{searchField('h-9')}</div>

          {/* Ordenação em text MAIS o ícone do modo current, como o "Recentes ▦"
           * do Spotify: um gatilho só dizendo as duas coisas que o menu atrás
           * dele controla. */}
          <PileMenu sort={sort} view={view} onSort={onSort} onView={onView}>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-muted text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
            >
              <span className="whitespace-nowrap">{pilesCopy.sorts[sort]}</span>
              <ViewModeIcon mode={view} />
            </button>
          </PileMenu>

          <span className="h-6 w-px shrink-0 bg-line" aria-hidden="true" />

          <CreatePilePopover>
            <Button className="shrink-0 gap-2">
              <PlusIcon />
              {pilesCopy.create.open}
            </Button>
          </CreatePilePopover>
        </div>
      </div>

      <div className="flex h-14 items-center gap-2 md:hidden">
        {searchField('h-11')}
        <PileMenu sort={sort} view={view} onSort={onSort} onView={onView}>
          <button
            type="button"
            aria-label={pilesCopy.menu}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50"
          >
            <ViewModeIcon mode={view} size={18} />
          </button>
        </PileMenu>
        <CreatePilePopover>
          <button
            type="button"
            aria-label={pilesCopy.create.open}
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-ink text-surface outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50"
          >
            <PlusIcon />
          </button>
        </CreatePilePopover>
      </div>
    </header>
  )
}
