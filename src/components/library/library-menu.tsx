import { useState } from 'react'
import { ActionMenuBack } from '@/components/menu/action-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ViewModeIcon } from '@/components/view/view-mode-icon'
import type { EntrySort, ViewMode } from '@/domain/library-view'
import { ENTRY_SORTS, STATUS_ORDER, VIEW_MODES } from '@/domain/library-view'
import type { EntryStatus, MediaType } from '@/domain/media'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { appCopy } from '@/lib/copy'
import { libraryCopy } from '@/routes/-library.copy'

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
  icon,
  on,
  onSelect,
}: {
  label: string
  /** O glifo à esquerda, quando a escolha TEM forma — só `View as` tem. */
  icon?: React.ReactNode
  on: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      // `aria-checked` e não só o visto: num menu de escolha única o leitor de
      // tela precisa ouvir qual está marcada sem depender do ícone.
      role="menuitemradio"
      aria-checked={on}
      className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm ${
        on
          ? 'text-ink'
          : 'text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink'
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 truncate">{label}</span>
      {on && (
        <span className="ml-auto">
          <Check />
        </span>
      )}
    </button>
  )
}

/**
 * Uma linha da vista raiz: o EIXO à esquerda, o valor atual à direita.
 *
 * **O valor à direita é a coisa que a lista plana não tinha.** Com as quatro
 * seções abertas, saber o recorte inteiro era procurar quatro vistos em 22
 * linhas; aqui ele se lê num olhar, e é isso que paga o clique a mais.
 *
 * A seta é a mesma do `ActionMenuItem submenu` — o app já diz "isto abre outra
 * vista" desse jeito, e um segundo desenho para a mesma promessa seria a
 * divergência que `action-menu.tsx` nasceu para tirar.
 */
function AxisRow({
  label,
  value,
  onOpen,
}: {
  label: string
  value: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
    >
      <span className="shrink-0 text-ink">{label}</span>
      {/* O valor cede espaço antes do rótulo do eixo: quem identifica a linha é
       * o eixo, e o valor reforça (a régua de 02/09, do nome do provedor). */}
      <span className="ml-auto min-w-0 truncate text-faint text-xs">
        {value}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M8 4l6 6-6 6" />
      </svg>
    </button>
  )
}

/** A cabeça de uma sub-vista: a volta, e o eixo que se está escolhendo. */
function Subview({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <ActionMenuBack onClick={onBack} />
      <p className="px-2 pt-2 pb-1 text-faint text-xs">{title}</p>
      {children}
    </div>
  )
}

type Axis = 'status' | 'type' | 'sort' | 'view'

/**
 * Os quatro eixos de `/library` num popover, e desde 07/09/2026 **cada um numa
 * sub-vista dentro do mesmo painel** (decisão do dono, entre três caminhos).
 *
 * ── Por que a lista plana caiu ──────────────────────────────────────────────
 * Medido na tela do dono: `Status` são 6 linhas, `Media type` são 8 nesta
 * instalação, mais 4 de `Sort by` e a fileira de `View as` — **22 linhas e 4
 * cabeçalhos** num painel de 256px de largura, passando de 900px de altura. O
 * teto do popover (item 1 do ciclo) impedia o vazamento, mas `Sort by` e
 * `View as` ficavam abaixo da dobra: chegar neles era rolar um menu.
 *
 * **As duas seções de recorte têm futuros DIFERENTES, e é isso que decide o
 * formato.** Status é enum fixo (brief, 3.16) — são 5 e serão 5. Tipo de mídia
 * não tem teto (3.10): o usuário cria os dele. Desenhar as duas iguais é
 * desenhar contra a curva errada de uma delas, e a sub-vista é o formato que
 * aguenta as duas sem mudar de forma quando a segunda crescer.
 *
 * ── E não é peça nova ───────────────────────────────────────────────────────
 * O app já abre lista dentro do próprio painel duas vezes: `Add to pile` no
 * `⋯` (`ActionMenuBack` + `ActionMenuPanel`) e o seletor de fonte de `/search`,
 * que desde 02/09 abre **no lugar** e não flutuando — submenu ancorado numa
 * linha teria conteúdo elástico acima (a nona leva). Aqui é o mesmo vocabulário
 * aplicado, não um segundo.
 *
 * ── O custo dos dois cliques, e por que ele é menor do que parece ───────────
 * O filtro de tipo mais usado **volta à fileira de chips** e se troca dali
 * (régua de 01/09). Este menu é o caminho de TRANSBORDO, não o comum — e dois
 * cliques num caminho de transbordo é o preço que o `Add to pile` já cobra.
 *
 * ── O que NÃO mudou ─────────────────────────────────────────────────────────
 * A seção de tipo lista **todos**, sempre (01/09): conteúdo de menu que depende
 * da largura da janela muda de assunto sem ninguém pedir. A sub-vista mantém
 * isso verdadeiro — ela não esconde nada, só deixa de mostrar tudo ao mesmo
 * tempo. E a ORDEM dos eixos segue a de antes: recorte (Status, Media type)
 * antes de arrumação (Sort by) antes de forma (View as).
 *
 * **Busca dentro da sub-vista de tipo fica para depois, e se MEDE.** O
 * `PilePicker` já tem o vocabulário (`Find a pile`), mas com 7 tipos ela não
 * serve pra nada — e este projeto mediu a fileira de chips antes de derrubá-la
 * (`domain/chip-fit.ts`).
 */
export function LibraryMenu({
  status,
  type,
  sort,
  view,
  onStatus,
  onType,
  onSort,
  onView,
  children,
}: {
  status: EntryStatus | null
  type: MediaType | null
  sort: EntrySort
  view: ViewMode
  onStatus: (next: EntryStatus | null) => void
  onType: (next: MediaType | null) => void
  onSort: (next: EntrySort) => void
  onView: (next: ViewMode) => void
  children: React.ReactNode
}) {
  const types = useOfferedMediaTypes(type)
  // Controlado só pra fechar na escolha. Os quatro eixos são escolha ÚNICA, e o
  // resultado aparece atrás do próprio popover — deixá-lo aberto tampando a
  // grade que acabou de mudar é esconder a resposta da pergunta.
  const [open, setOpen] = useState(false)
  const [axis, setAxis] = useState<Axis | null>(null)

  /**
   * Escolher fecha o painel E volta à raiz. A volta acontece com o painel já
   * fechado, então ninguém a vê — ela existe pra que reabrir mostre o recorte
   * inteiro, que é a coisa que a vista raiz serve.
   */
  const choose = (apply: () => void) => () => {
    apply()
    setOpen(false)
    setAxis(null)
  }

  const currentType = types.find((info) => info.slug === type)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAxis(null)
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-2">
        {axis === 'status' && (
          <Subview
            title={libraryCopy.filters.sectionStatus}
            onBack={() => setAxis(null)}
          >
            <Row
              label={libraryCopy.filters.anyStatus}
              on={status === null}
              onSelect={choose(() => onStatus(null))}
            />
            {STATUS_ORDER.map((value) => (
              <Row
                key={value}
                label={appCopy.statuses[value]}
                on={status === value}
                onSelect={choose(() => onStatus(value))}
              />
            ))}
          </Subview>
        )}

        {axis === 'type' && (
          <Subview
            title={libraryCopy.filters.sectionType}
            onBack={() => setAxis(null)}
          >
            <Row
              label={libraryCopy.filters.anyType}
              on={type === null}
              onSelect={choose(() => onType(null))}
            />
            {types.map((info) => (
              <Row
                key={info.slug}
                // O PLURAL, como na fileira: a linha nomeia um conjunto de
                // obras, não uma obra (design system, seção 8, sexta leva).
                label={info.plural}
                on={type === info.slug}
                onSelect={choose(() => onType(info.slug))}
              />
            ))}
          </Subview>
        )}

        {axis === 'sort' && (
          <Subview
            title={libraryCopy.filters.sectionSort}
            onBack={() => setAxis(null)}
          >
            {ENTRY_SORTS.map((value) => (
              <Row
                key={value}
                label={libraryCopy.sorts[value]}
                on={sort === value}
                onSelect={choose(() => onSort(value))}
              />
            ))}
          </Subview>
        )}

        {axis === 'view' && (
          <Subview
            title={libraryCopy.filters.sectionView}
            onBack={() => setAxis(null)}
          >
            {/*
             * **Linhas com rótulo, e não a fileira de ícones que estava aqui
             * antes.** Aquela decisão dizia que "empilhá-los como texto
             * gastaria quatro linhas pra dizer o que um ícone diz" — e o
             * argumento era sobre COMPETIÇÃO por espaço, num menu plano onde
             * quatro seções disputavam a altura. Numa sub-vista dedicada não há
             * com quem competir: os quatro ícones ocupavam 150 dos 256px e
             * deixavam o resto do painel vazio, o que se lê como peça faltando.
             *
             * **O ícone não se perde — ele vira o glifo da linha**, e é a mesma
             * forma das outras três sub-vistas: glifo, rótulo, visto. Foi a
             * gramática uniforme que decidiu o caminho da sub-vista, e ela vale
             * dentro dela também.
             */}
            {VIEW_MODES.map((value) => (
              <Row
                key={value}
                label={libraryCopy.views[value]}
                icon={<ViewModeIcon mode={value} />}
                on={view === value}
                onSelect={choose(() => onView(value))}
              />
            ))}
          </Subview>
        )}

        {axis === null && (
          <>
            <AxisRow
              label={libraryCopy.filters.sectionStatus}
              value={
                status === null
                  ? libraryCopy.filters.anyStatus
                  : appCopy.statuses[status]
              }
              onOpen={() => setAxis('status')}
            />
            <AxisRow
              label={libraryCopy.filters.sectionType}
              /**
               * O tipo escolhido pode não estar entre os OFERECIDOS enquanto a
               * preferência não chegou — `useOfferedMediaTypes` devolve vazio
               * nesse intervalo (régua de 04/09). Cair no rótulo de "qualquer
               * tipo" ali diria que não há filtro quando há; o slug cru é feio
               * e é verdade, e dura um quadro.
               */
              value={
                type === null
                  ? libraryCopy.filters.anyType
                  : (currentType?.plural ?? type)
              }
              onOpen={() => setAxis('type')}
            />
            <AxisRow
              label={libraryCopy.filters.sectionSort}
              value={libraryCopy.sorts[sort]}
              onOpen={() => setAxis('sort')}
            />
            <AxisRow
              label={libraryCopy.filters.sectionView}
              value={libraryCopy.views[view]}
              onOpen={() => setAxis('view')}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
