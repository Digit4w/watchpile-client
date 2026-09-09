import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchKeys } from '@/hooks/queries/search/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import { useDeleteAllEntries } from './use-delete-all-entries'
import { useDeleteEntry } from './use-delete-entry'
import { useLinkEntry } from './use-link-entry'
import { useUnlinkEntry } from './use-unlink-entry'

vi.mock('@/services/entries', () => ({
  entriesService: {
    remove: vi.fn(async () => undefined),
    removeAll: vi.fn(async () => ({ deleted: 3 })),
    link: vi.fn(async () => ({})),
    unlink: vi.fn(async () => undefined),
  },
}))

/**
 * **Duas escritas que mexem no mesmo campo de uma resposta precisam invalidar
 * as mesmas chaves.**
 *
 * `owned` e `ownedEntryId` saem de `external_ids` cruzado com as obras do
 * usuário (`search.query.ts`, no servidor), e QUATRO mutações mexem nessas
 * linhas: apagar uma obra, apagar todas, vincular e desvincular. `useCreateEntry`
 * avisava a busca desde que o selo nasceu; as outras não avisavam nenhuma — e o
 * defeito visível era o do relato: remover a obra e ela continuar constando
 * como `Already in your library` na busca seguinte.
 *
 * **A assimetria não aparece em teste de unidade nenhum, porque cada hook está
 * certo sozinho.** Só um teste que afirme a REGRA sobre as quatro a pega, e é
 * por isso que este arquivo é um só e não quatro.
 *
 * `useUpdateEntry` está de fora de propósito: trocar o tipo mexeria no par
 * `(tipo, provedor, id externo)`, mas a folha de editar **tranca o tipo quando
 * a obra tem vínculo** — e obra sem vínculo não tem linha em `external_ids`
 * para ficar velha.
 */

const PROVIDER_TITLE = titleKeys.ofProvider('mal', '21')
const SEARCH_QUERY = searchKeys.query({ type: 'anime', q: 'one piece' })

/**
 * O cliente é montado aqui e não em `createTestQueryClient` por um motivo: lá
 * o `gcTime` é zero, que é o certo pra teste de componente — o cache não pode
 * vazar de um teste pro outro. Aqui a ENTRADA de cache é o próprio sujeito, e
 * com `gcTime: 0` ela é coletada no mesmo instante em que `setQueryData` a
 * cria, porque nenhum componente a observa. `getQueryState` devolvia
 * `undefined` e a asserção falhava sem ter olhado nada.
 */
function seed() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(SEARCH_QUERY, { results: [], owned: { '21': 7 } })
  queryClient.setQueryData(PROVIDER_TITLE, { ownedEntryId: 7 })

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return { queryClient, wrapper }
}

describe('as escritas que mudam `owned` avisam as telas do provedor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('apagar uma obra invalida a busca e o detalhe do provedor', async () => {
    const { queryClient, wrapper } = seed()
    const { result } = renderHook(() => useDeleteEntry(), { wrapper })

    result.current.mutate(7)

    await waitFor(() => {
      expect(queryClient.getQueryState(SEARCH_QUERY)?.isInvalidated).toBe(true)
    })
    expect(queryClient.getQueryState(PROVIDER_TITLE)?.isInvalidated).toBe(true)
  })

  it('apagar a biblioteca inteira invalida as duas', async () => {
    const { queryClient, wrapper } = seed()
    const { result } = renderHook(() => useDeleteAllEntries(), { wrapper })

    result.current.mutate()

    await waitFor(() => {
      expect(queryClient.getQueryState(SEARCH_QUERY)?.isInvalidated).toBe(true)
    })
    expect(queryClient.getQueryState(PROVIDER_TITLE)?.isInvalidated).toBe(true)
  })

  it('vincular invalida a busca e o detalhe DAQUELE par', async () => {
    const { queryClient, wrapper } = seed()
    const other = titleKeys.ofProvider('tmdb', '1396')
    queryClient.setQueryData(other, { ownedEntryId: null })

    const { result } = renderHook(() => useLinkEntry(7), { wrapper })

    result.current.mutate({ provider: 'mal', externalId: '21' })

    await waitFor(() => {
      expect(queryClient.getQueryState(SEARCH_QUERY)?.isInvalidated).toBe(true)
    })
    expect(queryClient.getQueryState(PROVIDER_TITLE)?.isInvalidated).toBe(true)
    // o par que não foi tocado fica onde estava — vincular sabe de qual fala
    expect(queryClient.getQueryState(other)?.isInvalidated).toBe(false)
  })

  it('desvincular invalida a busca e o detalhe do provedor', async () => {
    const { queryClient, wrapper } = seed()
    const { result } = renderHook(() => useUnlinkEntry(7), { wrapper })

    result.current.mutate('mal')

    await waitFor(() => {
      expect(queryClient.getQueryState(SEARCH_QUERY)?.isInvalidated).toBe(true)
    })
    expect(queryClient.getQueryState(PROVIDER_TITLE)?.isInvalidated).toBe(true)
  })
})
