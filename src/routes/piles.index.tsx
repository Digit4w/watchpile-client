import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { SessionPending } from '@/components/chrome/session-pending'
import { EditPileSheet } from '@/components/piles/edit-pile-sheet'
import { PileGrid, PileGridSkeleton } from '@/components/piles/pile-grid'
import { PileHeader } from '@/components/piles/pile-header'
import { PileCompactList, PileList } from '@/components/piles/pile-list'
import {
  PilesEmpty,
  PilesError,
  PilesNoMatch,
} from '@/components/piles/pile-states'
import type { Pile } from '@/domain/media'
import { DEFAULT_PILE_SORT, PILE_SORTS } from '@/domain/pile-view'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { usePiles } from '@/hooks/queries/piles/use-piles'
import { useDebounced } from '@/hooks/use-debounced'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { useRequireSession } from '@/hooks/use-require-session'
import { usePileViewMode } from '@/hooks/use-view-mode'
import { pilesCopy } from './-piles.copy'

/**
 * `piles.index.tsx` e não `piles.tsx`: com o nome sem `.index` o arquivo vira
 * rota PAI de `piles.$pileId.tsx`, e como esta tela não renderiza `<Outlet/>`
 * a tela da pilha nunca aparecia — `/piles/1` desenhava a listagem. Como
 * índice, as duas são irmãs e cada uma é uma folha.
 */
export const Route = createFileRoute('/piles/')({
  component: PilesRoute,
})

/**
 * Busca e ordenação moram na URL, não em estado local (client/CLAUDE.md, "Onde
 * cada estado mora"): "minhas pilhas, da maior pra menor" é uma tela inteira
 * que se manda pra alguém, e o botão de voltar do navegador desfaz a busca em
 * vez de sair do app.
 *
 * O MODO DE EXIBIÇÃO fica de fora de propósito — ele é densidade, que a mesma
 * tabela põe no `localStorage` do aparelho.
 *
 * Quem escreve a URL é o `nuqs`, e o `validateSearch` da rota fica vazio: um
 * parâmetro tem um dono só, e dois donos escrevendo no mesmo lugar é um bug que
 * só aparece em produção.
 */
const PARSERS = {
  q: parseAsString.withDefault(''),
  sort: parseAsStringLiteral(PILE_SORTS).withDefault(DEFAULT_PILE_SORT),
}

function PilesRoute() {
  const navigate = useNavigate()
  const user = useRequireSession()
  const logout = useLogout()
  const [{ q, sort }, setView] = useQueryStates(PARSERS)
  /**
   * A folha de edição guarda a PILHA, não um booleano: ela precisa saber qual
   * está editando, e o `null` já é o fechado. Não vai pra URL, ao contrário da
   * busca — é um formulário meio preenchido, e um link que reabre a folha não
   * diz nada a quem o recebe.
   */
  const [editing, setEditing] = useState<Pile | null>(null)
  const [view, setViewMode] = usePileViewMode()

  // A caixa de busca responde na hora; a consulta espera a digitação parar.
  const search = useDebounced(q)
  const filtered = q !== ''

  /**
   * Duas consultas, e a segunda não é desperdício.
   *
   * `all` responde a duas perguntas que a lista buscada não responde: o total,
   * que o cabeçalho mostra ao lado do título, e se **não há pilha nenhuma** —
   * sem isso não dá pra separar "você ainda não criou nada" de "nada casa com
   * esta busca", que são telas diferentes com saídas diferentes.
   *
   * Sem busca as duas chamadas têm a mesma chave e viram uma requisição só.
   */
  const all = usePiles({ sort })
  const list = usePiles(filtered ? { q: search || undefined, sort } : { sort })

  /**
   * `isPending` aqui é só a primeira carga — depois do `keepPreviousData` a
   * troca de busca não passa mais por ele. E mesmo essa primeira carga só vira
   * esqueleto se demorar: contra um SQLite local ela costuma não demorar.
   *
   * Fica AQUI, junto dos outros hooks, e não lá embaixo perto de onde é usado:
   * abaixo dele há um `return` antecipado enquanto a sessão não resolve, e um
   * hook depois de um return condicional roda um número diferente de vezes a
   * cada render.
   */
  const loading = useDelayedPending(list.isPending)

  /**
   * A folha edita a pilha que está no cache, não a cópia congelada de quando
   * ela abriu: sem isto, salvar deixaria a folha mostrando o nome velho até
   * fechar, e o quadrado de arte não acompanharia uma obra adicionada em outra
   * aba.
   */
  const editingPile =
    editing === null
      ? null
      : (list.data?.find(({ id }) => id === editing.id) ?? editing)

  if (!user) {
    return <SessionPending />
  }

  const piles = list.data ?? []
  // `isSuccess` e não `data?.length === 0`: enquanto o total não voltou,
  // "nenhuma pilha" seria `false` por falta de resposta, e uma conta sem pilha
  // com busca ligada piscaria "nada casa" antes de mostrar a verdade.
  const noPilesAtAll = all.isSuccess && all.data.length === 0

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      screenTitle={pilesCopy.title}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PileHeader
          showing={piles.length}
          total={all.data?.length ?? null}
          search={q}
          sort={sort}
          view={view}
          onSearch={(next) => setView({ q: next || null })}
          onSort={(next) => setView({ sort: next })}
          onView={setViewMode}
        />

        {loading && <PileGridSkeleton />}

        {list.isError && (
          <PilesError error={list.error} onRetry={() => list.refetch()} />
        )}

        {/* A order importa: "nenhuma pilha" vence "nada casa", porque com zero
         * pilha toda busca devolve zero — e mandar quem nunca criou nada
         * "limpar a busca" seria apontar pro lugar errado. */}
        {list.isSuccess && piles.length === 0 && noPilesAtAll && <PilesEmpty />}

        {list.isSuccess &&
          all.isSuccess &&
          piles.length === 0 &&
          !noPilesAtAll && (
            <PilesNoMatch onClear={() => setView({ q: null })} />
          )}

        {/* Um modo, um componente — e não um componente parametrizado por
         * densidade. Os três dividem o ladrilho, mas a ESTRUTURA de cada um é
         * outra: um é grade, dois são lista com cabeçalho de colunas, e um
         * deles não tem arte nenhuma. */}
        {list.isSuccess && piles.length > 0 && (
          <>
            {view === 'grid' && <PileGrid piles={piles} onEdit={setEditing} />}
            {view === 'list' && <PileList piles={piles} onEdit={setEditing} />}
            {view === 'compact-list' && (
              <PileCompactList piles={piles} onEdit={setEditing} />
            )}
          </>
        )}
      </div>

      <EditPileSheet
        pile={editingPile}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
          }
        }}
      />
    </AppShell>
  )
}
