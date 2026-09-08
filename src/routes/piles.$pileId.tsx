import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useMemo, useState } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { SessionPending } from '@/components/chrome/session-pending'
import { AddTitlesSheet } from '@/components/piles/add-titles-sheet'
import { EditPileSheet } from '@/components/piles/edit-pile-sheet'
import { PileDetailControls } from '@/components/piles/pile-detail-controls'
import { PileDetailHeader } from '@/components/piles/pile-detail-header'
import {
  PileDetailError,
  PileDetailSkeleton,
  PileEmpty,
  PileNoMatch,
  PileNotFound,
} from '@/components/piles/pile-detail-states'
import {
  PileEntryCompactGrid,
  PileEntryGrid,
} from '@/components/piles/pile-entry-grid'
import { PileEntryList } from '@/components/piles/pile-entry-list'
import { VIEW_MODES } from '@/domain/library-view'
import type { PileDetailViewMode } from '@/domain/pile-detail-view'
import {
  canReorder,
  DEFAULT_PILE_ENTRY_SORT,
  orderedIds,
  PILE_ENTRY_SORTS,
} from '@/domain/pile-detail-view'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { usePile } from '@/hooks/queries/piles/use-pile'
import { usePileEntries } from '@/hooks/queries/piles/use-pile-entries'
import { useDebounced } from '@/hooks/use-debounced'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { useRequireSession } from '@/hooks/use-require-session'
import { useStoredViewMode } from '@/hooks/use-view-mode'
import { pileDetailCopy } from './-pile-detail.copy'

export const Route = createFileRoute('/piles/$pileId')({
  component: PileDetailRoute,
})

/**
 * Busca, filtro de tipo e ordenação moram na URL; o modo de exibição não
 * (client/CLAUDE.md, "onde cada estado mora"). A régua é a mesma de `/library`:
 * recorte é o que se está vendo e um link com ele diz algo a quem recebe; modo
 * é densidade, preferência do aparelho.
 */
const PARSERS = {
  q: parseAsString.withDefault(''),
  // Qualquer slug, não mais os seis literais — mesma razão de `/library`
  // (brief, 3.12): `?type=podcast` é URL válida num servidor que tem podcast.
  type: parseAsString,
  sort: parseAsStringLiteral(PILE_ENTRY_SORTS).withDefault(
    DEFAULT_PILE_ENTRY_SORT,
  ),
}

function PileDetailRoute() {
  const { pileId } = Route.useParams()
  const id = Number(pileId)
  const navigate = useNavigate()
  const user = useRequireSession()
  const logout = useLogout()
  const [{ q, type, sort }, setView] = useQueryStates(PARSERS)
  const [view, setViewMode] = useStoredViewMode<PileDetailViewMode>(
    'watchpile:pile-detail-view',
    VIEW_MODES,
    'grid',
  )
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)

  const searchQuery = useDebounced(q)
  const pile = usePile(id)
  const entries = usePileEntries(id)

  /**
   * A ordem é memoizada pela COMPOSIÇÃO — o conjunto de ids —, não pelo
   * conteúdo. É a régua de 30/08/2026 feita mecanismo (design system, seção 8):
   * escrita que muda o conteúdo de um item troca o item no lugar, escrita que
   * muda a composição refaz a lista.
   *
   * Na prática: dar nota a uma obra numa lista ordenada por nota **não** a
   * arranca de baixo do cursor. A ordem só se refaz quando o leitor pede outra
   * (trocar `sort`) ou quando alguém entra ou sai da pilha.
   */
  const list = entries.data ?? []
  const compositionKey = list.map(({ id: entryId }) => entryId).join(',')
  // biome-ignore lint/correctness/useExhaustiveDependencies: a composição é a dependência, ver acima
  const order = useMemo(() => orderedIds(list, sort), [sort, compositionKey])

  const visible = useMemo(() => {
    const byId = new Map(list.map((entry) => [entry.id, entry]))
    const term = searchQuery.trim().toLowerCase()
    return order
      .map((entryId) => byId.get(entryId))
      .filter((entry) => entry !== undefined)
      .filter((entry) => type === null || entry.mediaType === type)
      .filter(
        (entry) => term === '' || entry.title.toLowerCase().includes(term),
      )
  }, [order, list, type, searchQuery])

  const isLoading = useDelayedPending(pile.isPending || entries.isPending)

  if (!user) {
    return <SessionPending />
  }

  const narrowed = q !== '' || type !== null
  const goBack = () => navigate({ to: '/piles' })

  function content() {
    /**
     * **O 404 vem antes do esqueleto, e a ordem foi um defeito visto na tela.**
     *
     * Com o esqueleto primeiro, `/piles/9999` ficava carregando pra sempre: a
     * pilha respondia 404 na hora, mas a consulta das obras seguia tentando de
     * novo, e `isPending` dela mantinha a espera de pé. Espera é para o que
     * ainda pode mudar de resposta — **uma resposta definitiva não fica atrás
     * de uma.**
     *
     * E ele não é o estado de erro (design system, seção 6, 31/08/2026): no
     * erro o servidor não respondeu e "Try again" faz sentido; no 404 ele
     * respondeu certo, e repetir dá 404 de novo.
     */
    if (pile.isError && pile.error.status === 404) {
      return <PileNotFound onBack={goBack} />
    }

    if (isLoading) {
      return <PileDetailSkeleton />
    }

    if (pile.isError || entries.isError) {
      return (
        <PileDetailError
          // Duas consultas seguram esta tela, e a que falhou é a que explica.
          // Se as duas caíram, o motivo é o mesmo — o servidor é um só.
          error={pile.error ?? entries.error}
          onRetry={() => {
            void pile.refetch()
            void entries.refetch()
          }}
        />
      )
    }

    if (!pile.data) {
      return null
    }

    return (
      <>
        <PileDetailHeader
          pile={pile.data}
          onAdd={() => setAdding(true)}
          onEdit={() => setEditing(true)}
          onDeleted={goBack}
        />
        <PileDetailControls
          searchQuery={q}
          type={type}
          sort={sort}
          view={view}
          onSearch={(next) => setView({ q: next || null })}
          onType={(next) => setView({ type: next })}
          onSort={(next) => setView({ sort: next })}
          onView={setViewMode}
        />

        {/* A order importa: "pilha vazia" vence "nada casa", porque com zero
         * obra todo recorte devolve zero — e mandar quem nunca pôs nada
         * "limpar a busca" apontaria pro lugar errado. */}
        {list.length === 0 && <PileEmpty onAdd={() => setAdding(true)} />}

        {list.length > 0 && visible.length === 0 && narrowed && (
          <PileNoMatch onClear={() => setView({ q: null, type: null })} />
        )}

        {visible.length > 0 && (
          <>
            {view === 'grid' && <PileEntryGrid entries={visible} pileId={id} />}
            {view === 'compact-grid' && (
              <PileEntryCompactGrid entries={visible} pileId={id} />
            )}
            {(view === 'list' || view === 'compact-list') && (
              <PileEntryList
                entries={visible}
                pileId={id}
                compact={view === 'compact-list'}
                reorderable={canReorder(sort, view)}
              />
            )}
          </>
        )}
      </>
    )
  }

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      // No celular a barra de cima mostra o nome da TELA, e aqui a tela é a
      // pilha. Enquanto ela não chegou, o rótulo genérico evita um cabeçalho
      // vazio piscando.
      screenTitle={pile.data?.name ?? pileDetailCopy.back}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{content()}</div>

      <EditPileSheet
        pile={editing ? (pile.data ?? null) : null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(false)
          }
        }}
      />
      <AddTitlesSheet pileId={id} open={adding} onOpenChange={setAdding} />
    </AppShell>
  )
}
