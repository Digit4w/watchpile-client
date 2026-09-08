import type { ReactNode } from 'react'
import { useState } from 'react'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ViewModeIcon } from '@/components/view/view-mode-icon'
import { VIEW_MODES } from '@/domain/library-view'
import type { MediaType } from '@/domain/media'
import type {
  PileDetailViewMode,
  PileEntrySort,
} from '@/domain/pile-detail-view'
import { PILE_ENTRY_SORTS } from '@/domain/pile-detail-view'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
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

function Row({
  label,
  on,
  onSelect,
  hint,
}: {
  label: string
  on: boolean
  onSelect: () => void
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      role="menuitemradio"
      aria-checked={on}
      title={hint}
      className={`flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm ${
        on
          ? 'text-ink'
          : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
      }`}
    >
      {label}
      {on && <Check />}
    </button>
  )
}

type PileDetailMenuProps = {
  type: MediaType | null
  sort: PileEntrySort
  view: PileDetailViewMode
  onType: (next: MediaType | null) => void
  onSort: (next: PileEntrySort) => void
  onView: (next: PileDetailViewMode) => void
  children: ReactNode
}

/**
 * Tipo, ordenação e modo — a mesma estrutura do menu de `/library`, com uma
 * diferença que é do OBJETO e não da tela: **não há seção de status**.
 *
 * Aqui o recorte que importa é "que tipo de coisa tem nesta pilha", e status
 * já é visível na coluna da lista. Repetir os cinco status num menu de uma
 * pilha de doze itens seria inventário por simetria com a tela do lado, que é
 * exatamente o que a seção 5 rejeita.
 */
function PileEntryMenu({
  type,
  sort,
  view,
  onType,
  onSort,
  onView,
  children,
}: PileDetailMenuProps) {
  const mediaTypes = useOfferedMediaTypes(type)
  const typeName = useMediaTypeName()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-2">
        <p className="px-2 pt-1 pb-1 text-faint text-xs">
          {pileDetailCopy.filters.sectionType}
        </p>
        <Row
          label={pileDetailCopy.filters.anyType}
          on={type === null}
          onSelect={() => {
            onType(null)
            setOpen(false)
          }}
        />
        {mediaTypes.map(({ slug: value }) => (
          <Row
            key={value}
            label={typeName(value)}
            on={type === value}
            onSelect={() => {
              onType(value)
              setOpen(false)
            }}
          />
        ))}

        <div className="my-1 border-line border-t" />

        <p className="px-2 pt-1 pb-1 text-faint text-xs">
          {pileDetailCopy.filters.sectionSort}
        </p>
        {PILE_ENTRY_SORTS.map((value) => (
          <Row
            key={value}
            label={pileDetailCopy.sorts[value]}
            on={sort === value}
            // A dica só existe nas ordens derivadas, e diz o que a alça sumida
            // não consegue dizer sozinha: arrastar não quebrou, ele não se
            // aplica a uma ordem que não é a da pilha.
            hint={value === 'manual' ? undefined : pileDetailCopy.reorderHint}
            onSelect={() => {
              onSort(value)
              setOpen(false)
            }}
          />
        ))}

        <div className="my-1 border-line border-t" />

        <p className="px-2 pt-1 pb-1 text-faint text-xs">
          {pileDetailCopy.filters.sectionView}
        </p>
        <div className="flex items-center gap-1 px-1 pb-1">
          {VIEW_MODES.map((value) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={view === value}
              title={pileDetailCopy.views[value]}
              aria-label={pileDetailCopy.views[value]}
              onClick={() => {
                onView(value)
                setOpen(false)
              }}
              className={`flex size-9 items-center justify-center rounded-sm ${
                view === value
                  ? 'bg-ink text-surface'
                  : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
              }`}
            >
              <ViewModeIcon mode={value} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type PileDetailControlsProps = {
  searchQuery: string
  type: MediaType | null
  sort: PileEntrySort
  view: PileDetailViewMode
  onSearch: (next: string) => void
  onType: (next: MediaType | null) => void
  onSort: (next: PileEntrySort) => void
  onView: (next: PileDetailViewMode) => void
}

/**
 * A faixa de RECORTE — a de baixo das duas do cabeçalho de tela, e **a que
 * gruda** (design system, seção 5, 31/08/2026). A identidade rola pra fora;
 * como se recorta, não.
 *
 * **Sem fileira de chips permanente.** Em `/library` a faixa de tipo é fixa
 * porque tipo é o eixo primário de "tudo que eu tenho". Numa pilha montada à
 * mão não é: quem juntou aquilo sabe o que pôs lá, e sete chips sobre doze
 * itens é chrome que não faz nada. O tipo vai pro menu e **volta como chip
 * removível quando ativo** — a outra metade da mesma regra, porque filtro
 * invisível é filtro que se esquece ligado.
 */
export function PileDetailControls({
  searchQuery,
  type,
  sort,
  view,
  onSearch,
  onType,
  onSort,
  onView,
}: PileDetailControlsProps) {
  const typeName = useMediaTypeName()
  const field = (height: string) => (
    <div className="relative min-w-0 flex-1">
      <SearchIcon />
      <Input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={pileDetailCopy.search}
        className={`${height} pr-3 pl-8 text-sm`}
      />
    </div>
  )

  const menuTrigger = (
    <>
      <span className="whitespace-nowrap">{pileDetailCopy.sorts[sort]}</span>
      <ViewModeIcon mode={view} />
    </>
  )

  return (
    // `top` muda com a plataforma porque o que está acima dele muda: no
    // celular há a barra do `app-shell` presa no topo, no desktop não há nada.
    <div className="sticky top-[var(--wp-app-bar)] z-20 -mx-4 mb-4 border-line border-b bg-glass px-4 backdrop-blur md:top-0 md:-mx-8 md:px-8">
      <div className="hidden h-18 items-center gap-3 md:flex">
        <div className="flex w-full max-w-md">{field('h-9')}</div>
        <span className="ml-auto" />
        <PileEntryMenu
          type={type}
          sort={sort}
          view={view}
          onType={onType}
          onSort={onSort}
          onView={onView}
        >
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-muted text-sm outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
          >
            {menuTrigger}
          </button>
        </PileEntryMenu>
      </div>

      <div className="flex h-14 items-center gap-2 md:hidden">
        {field('h-11')}
        <PileEntryMenu
          type={type}
          sort={sort}
          view={view}
          onType={onType}
          onSort={onSort}
          onView={onView}
        >
          <button
            type="button"
            aria-label={pileDetailCopy.menu}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50"
          >
            <ViewModeIcon mode={view} size={18} />
          </button>
        </PileEntryMenu>
      </div>

      {/* A fileira NASCE com o filtro e some com ele — "a fileira de filtro só
       * existe quando há eixo" (design system, seção 5). */}
      {type !== null && (
        <div className="flex h-14 items-center gap-2">
          <button
            type="button"
            onClick={() => onType(null)}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-sm border border-ink bg-ink px-3 text-sm text-surface md:h-9"
          >
            <MediaTypeIcon type={type} size={14} />
            {typeName(type)}
            <svg
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="shrink-0"
              aria-hidden="true"
            >
              <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
