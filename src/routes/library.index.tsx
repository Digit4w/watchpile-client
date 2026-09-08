import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { SessionPending } from '@/components/chrome/session-pending'
import { AddEntrySheet } from '@/components/library/add-entry-sheet'
import {
  LibraryCompactGrid,
  LibraryGrid,
  LibraryGridSkeleton,
} from '@/components/library/library-grid'
import { LibraryHeader } from '@/components/library/library-header'
import {
  LibraryCompactList,
  LibraryList,
} from '@/components/library/library-list'
import {
  LibraryEmpty,
  LibraryError,
  LibraryNoMatch,
} from '@/components/library/library-states'
import { DEFAULT_SORT, ENTRY_SORTS } from '@/domain/library-view'
import { ENTRY_STATUSES } from '@/domain/media'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { useEntries } from '@/hooks/queries/entries/use-entries'
import { useDebounced } from '@/hooks/use-debounced'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { useRequireSession } from '@/hooks/use-require-session'
import { useViewMode } from '@/hooks/use-view-mode'
import { libraryCopy } from './-library.copy'

export const Route = createFileRoute('/library/')({
  component: LibraryRoute,
})

/**
 * Recorte e ordenação moram na URL, não em estado local (client/CLAUDE.md, "Onde
 * cada estado mora"): "os animes que estou assistindo, por nota" é uma tela
 * inteira que se manda pra alguém, e o botão de voltar do navegador desfaz um
 * filtro em vez de sair do app.
 *
 * O MODO DE EXIBIÇÃO fica de fora disso de propósito — ele é densidade, que a
 * mesma tabela põe no `localStorage` do aparelho. Ele chega no incremento em
 * que os outros três modos existirem; até lá a tela é a grade.
 *
 * Quem escreve a URL é o `nuqs`, e o `validateSearch` da rota fica vazio: um
 * parâmetro tem um dono só, e dois donos escrevendo no mesmo lugar é um bug que
 * só aparece em produção.
 */
const PARSERS = {
  q: parseAsString.withDefault(''),
  /**
   * Qualquer slug, e não mais os seis literais. Com o tipo virando vocabulário
   * da instância (brief, 3.12), `?type=podcast` num servidor que tem podcast é
   * URL VÁLIDA — e o parser literal a descartaria calado, deixando a pessoa com
   * um link que não recorta nada.
   *
   * Slug inexistente cai no vazio-de-filtro, que é o estado certo: o servidor
   * também devolve lista vazia pra um `mediaType` que ele não conhece.
   */
  type: parseAsString,
  status: parseAsStringLiteral(ENTRY_STATUSES),
  sort: parseAsStringLiteral(ENTRY_SORTS).withDefault(DEFAULT_SORT),
}

function LibraryRoute() {
  const navigate = useNavigate()
  const user = useRequireSession()
  const logout = useLogout()
  const [{ q, type, status, sort }, setCrop] = useQueryStates(PARSERS)
  /**
   * A folha NÃO vai pra URL, ao contrário do recorte: ela é um formulário meio
   * preenchido, não um estado que se manda pra alguém. Um link que reabre a
   * folha vazia não diz nada a quem o recebe.
   */
  const [adding, setAdding] = useState(false)
  /**
   * O modo de exibição é o único controle da tela que NÃO vai pra URL: ele é
   * densidade, e densidade é preferência do aparelho (client/CLAUDE.md, tabela
   * de estado). Escolher lista compacta no monitor não deve virar lista
   * compacta no telefone da mesma conta.
   */
  const [view, setView] = useViewMode()

  // A caixa de busca responde na hora; a consulta espera a digitação parar.
  const searchQuery = useDebounced(q)

  const narrowed = q !== '' || type !== null || status !== null

  /**
   * Duas consultas, e a segunda não é desperdício.
   *
   * `todas` responde a duas perguntas que a lista recortada não responde: o
   * total da biblioteca, que o cabeçalho mostra ao lado do título, e se a
   * biblioteca está vazia DE VERDADE — sem isso não dá pra separar "você ainda
   * não tem nada" de "nada casa com este filtro", que são telas diferentes com
   * saídas diferentes.
   *
   * Sem recorte as duas chamadas têm a mesma chave e viram uma requisição só.
   */
  const all = useEntries()
  const list = useEntries(
    narrowed
      ? {
          mediaType: type ?? undefined,
          status: status ?? undefined,
          q: searchQuery || undefined,
          sort,
        }
      : { sort },
  )

  /**
   * `isPending` aqui é só a primeira carga — depois do `keepPreviousData` a
   * troca de recorte não passa mais por ele. E mesmo essa primeira carga só
   * vira esqueleto se demorar: contra um SQLite local ela costuma não demorar.
   *
   * Fica AQUI, junto dos outros hooks, e não lá embaixo perto de onde é usado:
   * abaixo dele há um `return` antecipado enquanto a sessão não resolve, e um
   * hook depois de um return condicional roda um número diferente de vezes a
   * cada render. Foi exatamente o que quebrou a tela na primeira tentativa.
   */
  const isLoading = useDelayedPending(list.isPending)

  if (!user) {
    return <SessionPending />
  }

  const entries = list.data ?? []
  // `isSuccess` e não `data?.length === 0`: enquanto a contagem total não
  // voltou, "vazia" seria `false` por falta de resposta, e uma biblioteca
  // vazia com filtro ligado piscaria "nada casa" antes de mostrar a verdade.
  const libraryEmpty = all.isSuccess && all.data.length === 0

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      screenTitle={libraryCopy.title}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <LibraryHeader
          showing={entries.length}
          total={all.data?.length ?? null}
          searchQuery={q}
          type={type}
          status={status}
          sort={sort}
          view={view}
          onSearch={(next) => setCrop({ q: next || null })}
          onType={(next) => setCrop({ type: next })}
          onStatus={(next) => setCrop({ status: next })}
          onSort={(next) => setCrop({ sort: next })}
          onView={setView}
          onAdd={() => setAdding(true)}
        />

        {isLoading && <LibraryGridSkeleton />}

        {list.isError && (
          <LibraryError error={list.error} onRetry={() => list.refetch()} />
        )}

        {/* A order importa: biblioteca vazia vence "nada casa", porque com zero
         * obra todo filtro devolve zero — e mandar quem nunca adicionou nada
         * "tentar outro tipo" seria apontar pro lugar errado. */}
        {list.isSuccess && entries.length === 0 && libraryEmpty && (
          <LibraryEmpty onAdd={() => setAdding(true)} />
        )}

        {list.isSuccess &&
          all.isSuccess &&
          entries.length === 0 &&
          !libraryEmpty && (
            <LibraryNoMatch
              onClear={() => setCrop({ q: null, type: null, status: null })}
            />
          )}

        {/* Um modo, um componente — e não um componente parametrizado por
         * densidade. Os quatro dividem a carta e a linha, mas a ESTRUTURA de
         * cada um é outra: dois são `ul` de grade, dois são lista com cabeçalho
         * de colunas, e um deles não tem arte nenhuma. */}
        {list.isSuccess && entries.length > 0 && (
          <>
            {view === 'grid' && <LibraryGrid entries={entries} />}
            {view === 'compact-grid' && (
              <LibraryCompactGrid entries={entries} />
            )}
            {view === 'list' && <LibraryList entries={entries} />}
            {view === 'compact-list' && (
              <LibraryCompactList entries={entries} />
            )}
          </>
        )}
      </div>

      <AddEntrySheet open={adding} onOpenChange={setAdding} />
    </AppShell>
  )
}
