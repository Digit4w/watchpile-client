import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

/**
 * O `render` que todo teste de componente usa, e o MODELO que os próximos
 * copiam.
 *
 * ── O que se finge é `services/`, nunca o hook ─────────────────────────────
 * `services/` é a única camada que fala com a API (é o que a tabela de camadas
 * do `client/CLAUDE.md` promete), então é ali que o teste corta — com
 * `vi.mock('@/services/…')` no arquivo do teste. Acima do corte tudo roda de
 * verdade: o TanStack Query, a invalidação, os `useMemo` e as regras de
 * `domain/` que o hook consome.
 *
 * **Fingir o HOOK seria testar outra coisa.** `useOfferedMediaTypes` combina
 * duas consultas e aplica `offeredTypes` — trocá-lo por um valor pronto apaga
 * exatamente a parte que decide, e o teste passaria a afirmar que o componente
 * renderiza o array que o próprio teste escreveu. Corta-se na fronteira que a
 * arquitetura já declarou, não na mais próxima.
 *
 * ── Um `QueryClient` NOVO por render ───────────────────────────────────────
 * Compartilhar um entre testes faz o segundo ver o cache do primeiro, e a
 * ordem dos arquivos passa a decidir o resultado — a forma mais cara de
 * intermitência que existe, porque some quando se roda o teste sozinho.
 *
 * `retry: false` porque a falha é o que vários testes vão AFIRMAR: com retry, o
 * caminho de erro leva segundos para chegar e o teste estoura o prazo em vez de
 * falhar dizendo o que houve.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function render(
  ui: ReactElement,
  queryClient = createTestQueryClient(),
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return { queryClient, ...rtlRender(ui, { wrapper: Wrapper }) }
}
