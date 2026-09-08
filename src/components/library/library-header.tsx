import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ViewModeIcon } from '@/components/view/view-mode-icon'
import type { EntrySort, ViewMode } from '@/domain/library-view'
import type { EntryStatus, MediaType } from '@/domain/media'
import { countOf } from '@/lib/format'
import { libraryCopy } from '@/routes/-library.copy'
import { LibraryChips } from './library-chips'
import { LibraryMenu } from './library-menu'

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

function Plus({ size = 14 }: { size?: number }) {
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

type LibraryHeaderProps = {
  /** Quantas obras a lista tem AGORA, já com o recorte aplicado. */
  showing: number
  /** Quantas a biblioteca tem no total, sem recorte. `null` enquanto carrega. */
  total: number | null
  searchQuery: string
  type: MediaType | null
  status: EntryStatus | null
  sort: EntrySort
  view: ViewMode
  onSearch: (next: string) => void
  onType: (next: MediaType | null) => void
  onStatus: (next: EntryStatus | null) => void
  onSort: (next: EntrySort) => void
  onView: (next: ViewMode) => void
  onAdd: () => void
}

/**
 * Duas faixas, e a divisão não é arbitrária (`design/mockups/library.html`).
 *
 * Desktop — a de cima (72px) é sobre a BIBLIOTECA INTEIRA: como ela se chama,
 * quanto tem, e as operações que valem pra ela toda (buscar, ordenar/exibir).
 * A de baixo (56px) é sobre o RECORTE: os chips. O Spotify põe busca e
 * ordenação na mesma linha dos chips; copiar isso não funcionou, porque são
 * sete chips contra os quatro deles e num monitor de 1280 o "Books" ficava
 * atrás do campo de busca.
 *
 * Celular — a faixa de título SOME: o `AppShell` já mostra o nome da tela na
 * barra de cima, e repetir gastaria 72 dos ~800px que o telefone tem.
 *
 * `ring` e não `border` na moldura de qualquer container desta tela: a borda
 * sai de dentro da altura (design system, seção 4). Aqui o `border-b` é
 * divisória, não contorno de caixa, e é a exceção.
 */
export function LibraryHeader({
  showing,
  total,
  searchQuery,
  type,
  status,
  sort,
  view,
  onSearch,
  onType,
  onStatus,
  onSort,
  onView,
  onAdd,
}: LibraryHeaderProps) {
  const narrowed = type !== null || status !== null || searchQuery !== ''
  const count =
    total === null
      ? null
      : narrowed
        ? `${showing} ${libraryCopy.countFiltered} ${countOf(total, libraryCopy.count)}`
        : countOf(total, libraryCopy.count)

  const searchField = (height: string) => (
    <div className="relative min-w-0 flex-1">
      <SearchIcon />
      <Input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={libraryCopy.search}
        className={`${height} pr-3 pl-8 text-sm`}
      />
    </div>
  )

  return (
    // `-mx-4 -mt-4` cancela o padding do `<main>` do shell: o cabeçalho encosta
    // nas bordas da área de conteúdo, e o `px` interno devolve o alinhamento.
    // `top` muda com a plataforma porque o que está acima dele muda: no
    // celular há a barra do `app-shell` presa no topo, no desktop não há nada.
    <header className="sticky top-[var(--wp-app-bar)] z-20 -mx-4 -mt-4 mb-4 border-line border-b bg-glass px-4 backdrop-blur md:top-0 md:-mx-8 md:-mt-8 md:px-8">
      <div className="hidden h-18 items-center justify-between gap-4 md:flex">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate font-semibold text-xl tracking-tight">
            {libraryCopy.title}
          </h1>
          {count && (
            <span className="shrink-0 text-faint text-sm tabular-nums">
              {count}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative flex w-56">{searchField('h-9')}</div>

          {/* Ordenação em text MAIS o ícone do modo current, como o "Recentes
           * ▦" do Spotify: um gatilho só dizendo as duas coisas que o menu
           * atrás dele controla. */}
          <LibraryMenu
            status={status}
            type={type}
            sort={sort}
            view={view}
            onStatus={onStatus}
            onType={onType}
            onSort={onSort}
            onView={onView}
          >
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-muted text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
            >
              <span className="whitespace-nowrap">
                {libraryCopy.sorts[sort]}
              </span>
              <ViewModeIcon mode={view} />
            </button>
          </LibraryMenu>

          <span className="h-6 w-px shrink-0 bg-line" aria-hidden="true" />

          <Button onClick={onAdd} className="shrink-0 gap-2">
            <Plus />
            {libraryCopy.add.open}
          </Button>
        </div>
      </div>

      <div className="flex h-14 items-center gap-2 md:hidden">
        {searchField('h-11')}
        <LibraryMenu
          status={status}
          type={type}
          sort={sort}
          view={view}
          onStatus={onStatus}
          onType={onType}
          onSort={onSort}
          onView={onView}
        >
          <button
            type="button"
            aria-label={libraryCopy.filters.menu}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50"
          >
            <ViewModeIcon mode={view} size={18} />
          </button>
        </LibraryMenu>
        <button
          type="button"
          onClick={onAdd}
          aria-label={libraryCopy.add.open}
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-ink text-surface outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          <Plus />
        </button>
      </div>

      <LibraryChips
        type={type}
        status={status}
        onType={onType}
        onClearStatus={() => onStatus(null)}
      />
    </header>
  )
}
